"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useI18n } from "./context";
import { callInteractionJson } from "@/lib/gemini/client";
import CONTENT_FR from "./content-fr.json";
import CONTENT_DE from "./content-de.json";

/**
 * Translating the question library.
 *
 * The interface strings live in a dictionary because there are about a hundred
 * of them and they change rarely. The questions are a different problem: over
 * four hundred of them, each with a title, a prompt and often several notes,
 * and the set grows every time a subject is deepened. A hand-written
 * dictionary for that would be roughly a thousand entries per language, stale
 * the moment a question is added, and written by someone guessing at the
 * French for "fan-out" and "grain".
 *
 * So the content is translated at runtime by the same model that already marks
 * the answers, and cached in localStorage per language. A question is
 * translated once per browser and read from the cache after that.
 *
 * Two consequences worth being clear about:
 *
 *  - It needs an API key. Without one the questions stay in English while the
 *    interface still switches, which is a degradation rather than a failure.
 *  - The first visit to a subject makes one request covering everything on
 *    screen. It renders in English until that returns rather than blocking.
 *
 * The cache is an external store read through useSyncExternalStore, the same
 * way the language preference itself is read. That is what keeps the fetch out
 * of component state: the effect only starts the request, and the store
 * notifies everyone when it lands.
 */

const CACHE_PREFIX = "prep.i18n.";

type Cache = Record<string, string>;

const EMPTY: Cache = {};

/**
 * Translations generated ahead of time by scripts/pretranslate.mjs and
 * committed.
 *
 * This is the primary source and the reason the questions translate for
 * everyone. Depending on the reader's own API key for something as basic as
 * "choosing French translates the app" was the wrong design: for anyone
 * without a key the interface switched and the questions silently did not.
 */
const SHIPPED: Record<string, Cache> = {
  fr: CONTENT_FR as Cache,
  de: CONTENT_DE as Cache,
};

/** Per-language cache, held at module scope so identity is stable. */
const stores: Record<string, Cache> = {};
const listeners = new Set<() => void>();
/** Requests already in flight, so two components asking at once send one. */
const inFlight = new Set<string>();

function readCache(lang: string): Cache {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + lang);
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}

function getStore(lang: string): Cache {
  if (lang === "en") return EMPTY;
  if (!stores[lang]) {
    // Shipped first, then anything this browser has translated since — so a
    // question added after the last pretranslate run still resolves once
    // somebody with a key has opened it.
    stores[lang] = { ...(SHIPPED[lang] ?? {}), ...readCache(lang) };
  }
  return stores[lang];
}

function updateStore(lang: string, additions: Cache): void {
  stores[lang] = { ...getStore(lang), ...additions };
  try {
    window.localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(stores[lang]));
  } catch {
    // Storage full or blocked. The translation still applies to this page
    // view and is simply fetched again next time.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

const LANGUAGE_NAMES: Record<string, string> = {
  fr: "French",
  de: "German",
};

/**
 * Asks for a batch in one request.
 *
 * Strings go out and come back as an array in the same order, which is what
 * keeps the mapping unambiguous — asking for an object keyed by the English
 * invites the model to normalise the keys and lose the match.
 */
async function translateBatch(
  strings: string[],
  lang: string,
): Promise<string[]> {
  const language = LANGUAGE_NAMES[lang];
  if (!language || !strings.length) return strings;

  const prompt = `Translate these strings into ${language}. They are from a technical interview practice app for data and analytics engineers.

Rules:
- Keep proper nouns and tool names exactly as they are: SQL, dbt, Spark, Kafka, Airflow, Python, Parquet, Snowflake, BigQuery, DuckDB, DAG, ETL, ELT, CDC, API, OLTP, OLAP, JSON, CSV, NULL, and any SQL keyword or function name.
- Keep anything inside backticks exactly as it is, backticks included.
- Translate the surrounding prose naturally, in the register a senior engineer would use speaking to a colleague. Do not translate literally where it would read as machine output.
- Where a technical term has a settled equivalent in ${language}, use it. Where practitioners in ${language} say the English term, keep the English term.
- Return the same number of strings, in the same order.

Return JSON only: {"translations": ["...", "..."]}

Strings:
${JSON.stringify(strings, null, 1)}`;

  const { data } = await callInteractionJson<{ translations: string[] }>(prompt);
  const out = data?.translations;

  // A short or long array means the mapping has slipped, and a translation
  // attached to the wrong question is worse than English.
  if (!Array.isArray(out) || out.length !== strings.length) return strings;
  return out.map((t, i) => (typeof t === "string" && t.trim() ? t : strings[i]));
}

/** Translates a set of strings, fetching only what is not already cached. */
function useTranslatedStrings(strings: string[]): Record<string, string> {
  const { lang } = useI18n();

  const cache = useSyncExternalStore(
    subscribe,
    () => getStore(lang),
    () => EMPTY,
  );

  // Stable across renders, so the effect does not re-issue the same request
  // every time the parent re-renders.
  const key = strings.join("\u0000");

  const missing = useMemo(
    () => (lang === "en" ? [] : strings.filter((s) => s && !(s in cache))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, key, cache],
  );
  const missingKey = missing.join("\u0000");

  useEffect(() => {
    if (lang === "en" || !missing.length) return;

    const token = `${lang}:${missingKey}`;
    if (inFlight.has(token)) return;
    inFlight.add(token);

    void translateBatch(missing, lang)
      .then((translated) => {
        const additions: Cache = {};
        missing.forEach((source, i) => {
          additions[source] = translated[i];
        });
        updateStore(lang, additions);
      })
      .catch(() => {
        // No key, no network, or a refusal. English is the fallback and the
        // interface has already switched, so the page stays usable.
      })
      .finally(() => {
        inFlight.delete(token);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, missingKey]);

  return useMemo(() => {
    const out: Record<string, string> = {};
    for (const s of strings) out[s] = cache[s] ?? s;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, cache]);
}

/** Translates a list of question titles in one request. */
export function useTranslatedTitles(titles: string[]): Record<string, string> {
  return useTranslatedStrings(titles);
}

interface Translatable {
  title: string;
  prompt: string[];
  notes?: string[];
  hint?: string;
  gotcha?: string;
  explanation?: string;
}

/**
 * Translates everything a problem shows in prose.
 *
 * Deliberately not the fixture SQL, the starter code or the expected output —
 * translating an identifier would make the problem unsolvable, and a
 * translated SQL keyword is not SQL.
 */
export function useTranslatedProblem<T extends Translatable>(
  problem: T,
): { content: T } {
  const strings = useMemo(
    () =>
      [
        problem.title,
        ...problem.prompt,
        ...(problem.notes ?? []),
        ...(problem.hint ? [problem.hint] : []),
        ...(problem.gotcha ? [problem.gotcha] : []),
        ...(problem.explanation ? [problem.explanation] : []),
      ].filter(Boolean),
    [problem],
  );

  const map = useTranslatedStrings(strings);

  const content = useMemo(
    () => ({
      ...problem,
      title: map[problem.title] ?? problem.title,
      prompt: problem.prompt.map((p) => map[p] ?? p),
      ...(problem.notes ? { notes: problem.notes.map((n) => map[n] ?? n) } : {}),
      ...(problem.hint ? { hint: map[problem.hint] ?? problem.hint } : {}),
      ...(problem.gotcha ? { gotcha: map[problem.gotcha] ?? problem.gotcha } : {}),
      ...(problem.explanation
        ? { explanation: map[problem.explanation] ?? problem.explanation }
        : {}),
    }),
    [problem, map],
  );

  return { content };
}
