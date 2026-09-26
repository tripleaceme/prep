"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { DICTIONARIES, LANGS, type Lang } from "./dictionary";

/**
 * Language state.
 *
 * Deliberately one setting, not two: choosing French switches the interface
 * *and* the interview — the questions, the spoken feedback, the speech
 * recognition locale. The original worked this way, and splitting them would
 * only produce French buttons around an English interview.
 *
 * The choice lives in localStorage rather than the URL, so there are no
 * per-language routes to maintain and a shared link opens in the recipient's
 * own language.
 */

const STORAGE_KEY = "prep.lang";

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "fr" || value === "de";
}

/* --------------------------------------------------------------------------
   localStorage is an external store, so it is read through
   useSyncExternalStore rather than copied into state inside an effect. That
   keeps the first client render matching the server's, and means a change in
   one tab reaches the others.
-------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLang(stored) ? stored : "en";
  } catch {
    // Private mode or blocked storage — English is a fine default.
    return "en";
  }
}

/** The server cannot know the preference, so it renders English. */
function getServerSnapshot(): Lang {
  return "en";
}

function writeLang(next: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore — the change still applies for this page view */
  }
  listeners.forEach((listener) => listener());
}

interface I18nValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  /** Translate by English source text. Unknown strings pass through. */
  t: (source: string) => string;
  locale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Syncing an attribute onto the document is what effects are for.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => writeLang(next), []);

  const value = useMemo<I18nValue>(() => {
    const dict = DICTIONARIES[lang];
    return {
      lang,
      setLang,
      // Falling back to the source text is the point of keying by English: an
      // untranslated string reads correctly rather than showing a key.
      t: (source: string) => dict[source] ?? source,
      locale: LANGS[lang].locale,
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    // Rendering outside the provider is a wiring mistake, but it should not
    // blank the page — fall through to English.
    return {
      lang: "en",
      setLang: () => {},
      t: (source: string) => source,
      locale: "en-US",
    };
  }
  return value;
}

/** Shorthand for the common case. */
export function useT(): (source: string) => string {
  return useI18n().t;
}
