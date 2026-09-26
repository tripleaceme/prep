"use client";

/**
 * Interviewer voice — ported from legacy/app.html.
 *
 * Browser text-to-speech quality depends entirely on the voices the OS ships,
 * and even the best sound noticeably robotic. Gemini has an actual TTS model,
 * so that is the primary voice, streamed over SSE so the interviewer starts
 * talking before the whole clip is generated. The browser voice is the last
 * resort when the Gemini call fails — offline, rate-limited, preview model
 * down.
 */

import { readApiKey } from "@/lib/apiKey";
import { INTERACTIONS_URL } from "./client";

/**
 * Preview model as of this writing. If Google renames or retires it, this is
 * the one constant to change.
 */
const TTS_MODEL = "gemini-3.1-flash-tts-preview";

/**
 * Interviewer names, each paired with a Gemini prebuilt voice.
 *
 * Deliberately plain and hard to place. The earlier set read as specifically
 * Nigerian or specifically South Asian, which quietly tells the candidate
 * something about who is interviewing them before a word is spoken. These are
 * short, common in several places, and get out of the way.
 */
export const PERSONA_VOICES: Record<string, string> = {
  Alex: "Charon", // calm, professional
  Sam: "Puck", // upbeat, lively
  Jordan: "Orus",
  Robin: "Aoede", // warm, melodic
  Morgan: "Leda",
  Casey: "Kore", // strong, firm
};

export const PERSONA_NAMES = Object.keys(PERSONA_VOICES);

let audioCtx: AudioContext | null = null;
let activeSources: AudioBufferSourceNode[] = [];
let nextPlayTime = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

export function stopSpeaking(): void {
  activeSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
  });
  activeSources = [];
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Gemini returns raw signed 16-bit little-endian PCM, which the Web Audio API
 * cannot decode directly — it has to be converted to float samples and
 * scheduled by hand. Each chunk is queued to start where the previous one
 * ended, which is what keeps streamed speech gapless.
 */
function schedulePcmChunk(
  base64Data: string,
  sampleRate: number,
  channels: number,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const bytes = base64ToBytes(base64Data);
  const sampleCount = Math.floor(bytes.length / 2);
  if (sampleCount <= 0) return;

  const buffer = ctx.createBuffer(channels || 1, sampleCount, sampleRate || 24000);
  const channelData = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < sampleCount; i++) {
    channelData[i] = view.getInt16(i * 2, true) / 32768;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);

  // A small floor above currentTime, or the first chunk can be scheduled in
  // the past and drop.
  const startAt = Math.max(nextPlayTime, ctx.currentTime + 0.02);
  source.start(startAt);
  nextPlayTime = startAt + buffer.duration;

  activeSources.push(source);
  source.onended = () => {
    const index = activeSources.indexOf(source);
    if (index !== -1) activeSources.splice(index, 1);
  };
}

/** Reads the SSE stream and plays each chunk as it arrives. */
async function streamSpeech(text: string, voice: string): Promise<void> {
  const apiKey = readApiKey();
  const ctx = getAudioContext();
  if (!apiKey || !ctx) throw new Error("streaming unavailable");

  nextPlayTime = ctx.currentTime + 0.05;

  const response = await fetch(`${INTERACTIONS_URL}?alt=sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: text,
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice }] },
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`TTS stream failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  let gotAudio = false;

  const handleEvent = (rawEvent: string) => {
    const line = rawEvent
      .split("\n")
      .find((l) => l.startsWith("data:"));
    if (!line) return;

    const json = line.slice(5).trim();
    if (!json || json === "[DONE]") return;

    let parsed: { delta?: { type?: string; data?: string; sample_rate?: number; channels?: number } };
    try {
      parsed = JSON.parse(json);
    } catch {
      return;
    }

    const delta = parsed?.delta;
    if (delta?.type === "audio" && delta.data) {
      gotAudio = true;
      schedulePcmChunk(delta.data, delta.sample_rate ?? 24000, delta.channels ?? 1);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    // SSE events are separated by a blank line; the tail may be a partial event.
    const events = buffered.split("\n\n");
    buffered = events.pop() ?? "";
    events.forEach(handleEvent);
  }

  if (!gotAudio) throw new Error("No audio in stream.");
}

function speakWithBrowserVoice(text: string, locale = "en-US"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    const language = locale.slice(0, 2).toLowerCase();
    const matching = voices.filter((v) =>
      v.lang?.toLowerCase().startsWith(language),
    );
    const pool = matching.length
      ? matching
      : voices.filter((v) => /^en/i.test(v.lang));
    const candidates = pool.length ? pool : voices;

    // Prefer the OS's higher-quality voices where they exist.
    const preferred = candidates.find((v) =>
      /(Natural|Neural|Enhanced|Premium|Google)/i.test(v.name),
    );
    const local = candidates.find((v) => v.localService);
    const chosen = preferred ?? local ?? candidates[0];
    if (chosen) utterance.voice = chosen;
  }

  utterance.lang = locale;
  window.speechSynthesis.speak(utterance);
}

/**
 * Say something as the interviewer. Never rejects: if every Gemini path fails
 * it falls back to the browser voice, because a silent interviewer is worse
 * than a robotic one.
 */
export async function speak(text: string, voice: string): Promise<void> {
  if (!readApiKey()) return;
  try {
    await streamSpeech(text, voice);
  } catch {
    speakWithBrowserVoice(text);
  }
}
