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
 * Models to try, in order.
 *
 * The original app pinned a single model and picked the previous generation,
 * on the reasoning that the newest one hits capacity limits first. That was
 * sound at the time and has since inverted — gemini-3.5-flash is now the one
 * returning "currently experiencing high demand".
 *
 * Rather than swap the pin and wait for it to invert again, requests fall
 * through this list whenever a model reports itself busy. Any single model
 * being overloaded is temporary and not worth failing an interview over;
 * pinning one makes its bad afternoon the user's problem.
 */
export const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash"] as const;

/** Kept for callers that only need to name the primary model. */
export const GEMINI_MODEL = GEMINI_MODELS[0];

export const INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

/**
 * Whether an error is the model being busy rather than the request being
 * wrong. Only these are worth retrying on a different model — a bad key or a
 * malformed request will fail identically everywhere.
 */
function isCapacityError(status: number, message: string): boolean {
  if (status === 429 || status === 503 || status === 500) return true;
  return /high demand|overloaded|unavailable|try again later|capacity|resource[_ ]exhausted/i.test(
    message,
  );
}

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

  let data: unknown = null;
  let lastCapacityMessage = "";

  // Falls through to the next model only when one reports itself busy. A bad
  // key or a malformed request fails on the first and stops there, rather than
  // being retried pointlessly against every model in the list.
  for (const model of GEMINI_MODELS) {
    const body: Record<string, unknown> = { model, input };
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
    let parsed: unknown = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (response.ok) {
      data = parsed;
      break;
    }

    const message =
      extractErrorMessage(parsed) ||
      (rawText
        ? rawText.slice(0, 300)
        : `Gemini request failed (${response.status})`);

    if (!isCapacityError(response.status, message)) {
      throw new Error(message);
    }

    lastCapacityMessage = message;
  }

  if (data === null) {
    throw new Error(
      lastCapacityMessage
        ? `Every Gemini model we try is busy right now. Google said: "${lastCapacityMessage}". Wait a minute and try again.`
        : "Gemini did not respond.",
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
