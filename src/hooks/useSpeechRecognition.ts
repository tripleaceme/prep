"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * Voice input — ported from legacy/app.html.
 *
 * Two behaviours from the original are load-bearing and easy to lose:
 *
 *  1. Microphone permission is requested once, explicitly, rather than letting
 *     SpeechRecognition request it implicitly on every start() call.
 *  2. The browser ends a recognition session on its own after a pause, so
 *     onend restarts it unless the stop was deliberate. Without that, someone
 *     pausing mid-answer is simply cut off.
 */

const MAX_RECORD_MS = 10 * 60 * 1000; // a real answer can run long
const SILENCE_STOP_MS = 2800; // auto-stop this long after they stop talking

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
}

type Constructor = new () => SpeechRecognitionLike;

function getConstructor(): Constructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: Constructor;
    webkitSpeechRecognition?: Constructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Feature detection never changes, so nothing ever calls the subscriber. */
const noopSubscribe = () => () => {};

export function useSpeechRecognition(locale = "en-US") {
  // Read through useSyncExternalStore rather than set in an effect: the server
  // snapshot is false, so the first client render matches and then corrects.
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getConstructor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const manualStopRef = useRef(false);
  const startedAtRef = useRef(0);
  const spokeRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const Ctor = getConstructor();
    if (!Ctor) return;

    // Ask once, up front, instead of on every question.
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => stream.getTracks().forEach((t) => t.stop()))
      .catch(() => {
        // They'll still get the normal prompt when they try to speak.
      });

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale;

    const clearSilence = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    const armSilence = () => {
      clearSilence();
      if (!spokeRef.current) return; // don't cut someone off before they start
      silenceTimerRef.current = setTimeout(() => {
        manualStopRef.current = true; // deliberate, so onend must not restart
        recognition.stop();
      }, SILENCE_STOP_MS);
    };

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalRef.current += text + " ";
        } else {
          interim += text;
        }
      }
      if (finalRef.current.trim() || interim.trim()) spokeRef.current = true;
      setTranscript((finalRef.current + interim).trimStart());
      armSilence();
    };

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" are routine; anything else stops the session.
      if (event.error !== "no-speech" && event.error !== "aborted") {
        manualStopRef.current = true;
      }
    };

    recognition.onend = () => {
      setListening(false);
      clearSilence();
      const withinTimeLimit = Date.now() - startedAtRef.current < MAX_RECORD_MS;
      if (!manualStopRef.current && withinTimeLimit) {
        try {
          recognition.start();
        } catch {
          /* it already restarted */
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      manualStopRef.current = true;
      clearSilence();
      try {
        recognition.stop();
      } catch {
        /* never started */
      }
      recognitionRef.current = null;
    };
  }, [locale]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    manualStopRef.current = false;
    spokeRef.current = false;
    finalRef.current = "";
    startedAtRef.current = Date.now();
    setTranscript("");
    try {
      recognition.start();
    } catch {
      /* already running */
    }
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* never started */
    }
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
  }, []);

  return { supported, listening, transcript, start, stop, reset, setTranscript };
}
