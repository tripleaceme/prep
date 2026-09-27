"use client";

import { useT } from "@/lib/i18n/context";

/**
 * Translates a string inside a Server Component.
 *
 * The language lives in localStorage, which the server cannot read, so
 * `useT()` only works in a Client Component. Most of the app's screens are
 * server-rendered — that is why the sidebar translated and the dashboard did
 * not.
 *
 * Converting each page to a Client Component would lose the server data
 * fetching they are built around. This is the small alternative: a client
 * boundary around a single string. The text still arrives in the HTML in
 * English, so it is present for search engines and for a reader whose
 * JavaScript has not run, and it is swapped on hydration.
 *
 *   <h1>Good afternoon, {firstName}</h1>
 *   becomes
 *   <h1><T>Good afternoon</T>, {firstName}</h1>
 *
 * Keyed by the English source text like the rest of the dictionary, so a
 * string with no translation yet renders as readable English rather than as a
 * missing key.
 */
export function T({ children }: { children: string }) {
  const t = useT();
  return <>{t(children)}</>;
}

/**
 * The same thing where a string is needed as a prop rather than as content —
 * a placeholder, an aria-label, a title attribute.
 */
export function useTranslate(): (source: string) => string {
  return useT();
}
