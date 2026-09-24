"use client";

import { useSyncExternalStore } from "react";
import { readApiKey, subscribeApiKey } from "@/lib/apiKey";

/**
 * Reads the stored Gemini key.
 *
 * localStorage is an external store, so `useSyncExternalStore` is the right
 * primitive: it avoids the read-in-an-effect-then-setState pattern, and its
 * server snapshot keeps the first client render matching the server's.
 */
export function useApiKey(): string | null {
  return useSyncExternalStore(
    subscribeApiKey,
    readApiKey,
    // The server cannot know, so it renders as absent and corrects on hydration.
    () => null,
  );
}

export function useHasApiKey(): boolean {
  return useApiKey() !== null;
}
