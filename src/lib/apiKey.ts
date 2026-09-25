"use client";

/**
 * Bring-your-own-key storage.
 *
 * The user's Gemini key lives in localStorage and nowhere else — it is never
 * sent to Supabase, never logged, and never leaves the browser except in the
 * direct call to Google. This is the same model the current app uses; the
 * dashboard just makes its state visible where the reference product shows a
 * credit balance.
 */

const STORAGE_KEY = "prep.gemini.apiKey";
const EVENT = "prep:apikey-changed";

export type ApiKeyState = "connected" | "absent";

export function readApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    // Private mode, or site data blocked.
    return null;
  }
}

export function writeApiKey(key: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, key.trim());
  } catch {
    /* ignore — the caller surfaces a message */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearApiKey(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeApiKey(onChange: () => void): () => void {
  // `storage` covers other tabs; the custom event covers this one.
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/*
 * There is deliberately no key-format check here.
 *
 * The original app only checked the field was non-empty, and that was right:
 * Google does not document a stable shape for these keys and can change it
 * whenever it likes. A regex guessing at "AIza + 35 characters" rejected a
 * perfectly good key, which is a worse failure than letting a bad one through
 * — Google rejects a bad key on the first request, with a real message.
 */
