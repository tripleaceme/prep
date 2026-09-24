"use client";

/**
 * Gemini Interactions API client — ported from legacy/app.html.
 *
 * Runs in the browser against the user's own key. Two things here were learned
 * the hard way and must not be "tidied up":
 *
 *  1. No `Api-Revision` header. Some of Google's docs show it, but
 *     generativelanguage.googleapis.com does not allow that custom header in
 *     its CORS preflight, so sending it makes every browser request fail with
 *     "Failed to fetch" before it reaches Google.
 *  2. The response shape is parsed defensively. This is a newer API surface and
 *     the shape is not consistent across Google's own documentation.
 */

import { readApiKey } from "@/lib/apiKey";

/**
 * generateContent's old client-key flow was retired for new users in favour of
 * the Interactions API, and gemini-2.5-flash is no longer available to new
 * keys. This is the previous-generation flash model rather than the newest,
 * because the newest tends to hit capacity limits first. If Google renames
 * models again, this is the one constant to change.
 */
export const GEMINI_MODEL = "gemini-3.5-flash";
export const INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

export class MissingKeyError extends Error {
  constructor() {
    super("Add your Gemini API key in Settings to start an interview.");
    this.name = "MissingKeyError";
  }
}

export interface Interaction {
  /** Pass back as `previousId` to continue the conversation server-side. */
  id: string | null;
  text: string;
}

/** Google's error envelope is usually {error:{message}}, but be defensive. */
function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (typeof d.error === "string") return d.error;
  if (d.error && typeof d.error === "object") {
    const message = (d.error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  if (typeof d.message === "string") return d.message;
  return "";
}

/**
 * Some Google surfaces return the identifier as `.id`, others as a resource
 * `.name` like "interactions/int_123".
 */
function extractInteractionId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.id === "string" && d.id) return d.id;
  if (typeof d.name === "string" && d.name) {
    const parts = d.name.split("/");
    return parts[parts.length - 1];
  }
  return null;
}

/** Text can surface three different ways depending on SDK versus raw REST. */
export function extractInteractionText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;

  if (typeof d.output_text === "string") return d.output_text;

  if (Array.isArray(d.outputs) && d.outputs.length) {
    const last = d.outputs[d.outputs.length - 1];
    if (last && typeof last.text === "string") return last.text;
  }

  if (Array.isArray(d.steps)) {
    for (let i = d.steps.length - 1; i >= 0; i--) {
      const step = d.steps[i];
      if (step?.type === "model_output" && Array.isArray(step.content)) {
        const parts = step.content
          .filter(
            (c: unknown) =>
              !!c &&
              typeof c === "object" &&
              (c as Record<string, unknown>).type === "text" &&
              typeof (c as Record<string, unknown>).text === "string",
          )
          .map((c: Record<string, string>) => c.text);
        if (parts.length) return parts.join("\n");
      }
    }
  }
  return "";
}

interface CallOptions {
  /** Re-sent on every call: it is not part of the persisted conversation. */
  systemInstruction?: string;
  /** Omit to start a new conversation. */
  previousId?: string | null;
  signal?: AbortSignal;
}

export async function callInteraction(
  input: string,
  { systemInstruction, previousId, signal }: CallOptions = {},
): Promise<Interaction> {
  const apiKey = readApiKey();
  if (!apiKey) throw new MissingKeyError();

  const body: Record<string, unknown> = { model: GEMINI_MODEL, input };
  if (systemInstruction) body.system_instruction = systemInstruction;
  if (previousId) body.previous_interaction_id = previousId;

  const response = await fetch(INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal,
  });

  const rawText = await response.text();
  let data: unknown = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data) ||
        (rawText
          ? rawText.slice(0, 300)
          : `Gemini request failed (${response.status})`),
    );
  }

  const text = extractInteractionText(data);
  if (!text) throw new Error("Gemini returned an empty response.");

  return { id: extractInteractionId(data), text: text.trim() };
}

/**
 * Ask for JSON and parse it, stripping the markdown fences models add even
 * when told not to.
 */
export async function callInteractionJson<T>(
  input: string,
  options: CallOptions = {},
): Promise<{ data: T; id: string | null }> {
  const { text, id } = await callInteraction(input, options);
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return { data: JSON.parse(cleaned) as T, id };
  } catch {
    throw new Error(
      "Couldn't read the model's response. It may have been cut short — try again.",
    );
  }
}
