#!/usr/bin/env node
/**
 * Translates the whole question library once, and writes the result into the
 * repo so it ships with the app.
 *
 * Why this exists: the first version translated question content in the
 * browser at runtime. That was wrong. It made a basic expectation — choosing
 * French translates the app — depend on the reader having supplied their own
 * API key, so for most people the interface switched and the questions stayed
 * in English with no explanation.
 *
 * Running this once moves that cost to build time. The translations become
 * files in the repo: no key needed to read them, nothing to wait for, and
 * they can be reviewed and corrected by hand like any other source.
 *
 * Usage:
 *
 *   GEMINI_API_KEY=... node scripts/pretranslate.mjs
 *   GEMINI_API_KEY=... node scripts/pretranslate.mjs --lang fr
 *
 * It is incremental: anything already present in the output file is left
 * alone, so adding fifty questions costs fifty translations rather than a
 * thousand, and a hand-corrected line is never overwritten.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src/lib/i18n");

const LANGUAGES = { fr: "French", de: "German" };
const MODEL = "gemini-3.6-flash";
const BATCH = 40;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "Set GEMINI_API_KEY. Get one free at https://aistudio.google.com/apikey",
  );
  process.exit(1);
}

const only = process.argv.includes("--lang")
  ? process.argv[process.argv.indexOf("--lang") + 1]
  : null;

/* -------------------------------------------------------------------------
   Load the library. The problems are TypeScript with path aliases, so they
   are bundled to a temporary ESM file rather than parsed by hand — that way
   this script cannot drift from what the app actually renders.
------------------------------------------------------------------------- */

function loadProblems() {
  const dir = mkdtempSync(join(tmpdir(), "prep-i18n-"));
  const entry = join(dir, "entry.mjs");

  execFileSync(
    "npx",
    [
      "--yes",
      "esbuild",
      "src/lib/problems/index.ts",
      "--bundle",
      "--format=esm",
      "--platform=node",
      "--log-level=error",
      // The diagram registry pulls in JSX we neither need nor can run here.
      "--alias:@/components/diagrams=" + join(dir, "stub.mjs"),
      "--outfile=" + entry,
    ],
    { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] },
  );

  return import(entry).then((m) => m.PROBLEMS);
}

writeFileSync(
  join(mkdtempSync(join(tmpdir(), "prep-stub-")), "stub.mjs"),
  "export const DIAGRAMS = {};\n",
);

/* ------------------------------------------------------------------------- */

function collect(problems) {
  const strings = new Set();
  for (const p of problems) {
    strings.add(p.title);
    p.prompt?.forEach((s) => strings.add(s));
    p.notes?.forEach((s) => strings.add(s));
    p.keyPoints?.forEach((s) => strings.add(s));
    p.modelAnswer?.forEach((s) => strings.add(s));
    if (p.hint) strings.add(p.hint);
    if (p.gotcha) strings.add(p.gotcha);
    if (p.explanation) strings.add(p.explanation);
  }
  // Never the fixture SQL, the starter code or the expected output: a
  // translated identifier makes a problem unsolvable.
  return [...strings].filter((s) => typeof s === "string" && s.trim());
}

async function translate(strings, lang) {
  const language = LANGUAGES[lang];
  const prompt = `Translate these strings into ${language}. They are from a technical interview practice app for data and analytics engineers.

Rules:
- Keep proper nouns and tool names exactly as they are: SQL, dbt, Spark, Kafka, Airflow, Python, Parquet, Snowflake, BigQuery, DuckDB, DAG, ETL, ELT, CDC, API, OLTP, OLAP, JSON, CSV, NULL, and any SQL keyword, function name or column name.
- Keep anything inside backticks exactly as it is, backticks included.
- Translate the surrounding prose naturally, in the register a senior engineer would use speaking to a colleague. Do not translate literally where it would read as machine output.
- Where a technical term has a settled equivalent in ${language}, use it. Where practitioners in ${language} say the English term, keep the English term.
- Return exactly ${strings.length} strings, in the same order.

Return JSON only: {"translations": ["...", "..."]}

Strings:
${JSON.stringify(strings, null, 1)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }

  const body = await response.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = JSON.parse(text);
  const out = parsed?.translations;

  // A short or long array means the mapping has slipped, and a translation
  // attached to the wrong question is worse than English.
  if (!Array.isArray(out) || out.length !== strings.length) {
    throw new Error(
      `expected ${strings.length} translations, got ${out?.length ?? "none"}`,
    );
  }
  return out;
}

/* ------------------------------------------------------------------------- */

const problems = await loadProblems();
const strings = collect(problems);
console.log(`${problems.length} problems, ${strings.length} distinct strings`);

for (const lang of Object.keys(LANGUAGES)) {
  if (only && lang !== only) continue;

  const file = join(OUT_DIR, `content-${lang}.json`);
  const existing = existsSync(file)
    ? JSON.parse(readFileSync(file, "utf8"))
    : {};

  const missing = strings.filter((s) => !(s in existing));
  console.log(
    `\n${LANGUAGES[lang]}: ${strings.length - missing.length} already done, ${missing.length} to translate`,
  );

  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    const n = Math.floor(i / BATCH) + 1;
    const of = Math.ceil(missing.length / BATCH);
    process.stdout.write(`  batch ${n}/${of} (${chunk.length}) … `);

    try {
      const translated = await translate(chunk, lang);
      chunk.forEach((source, j) => {
        existing[source] = translated[j];
      });
      // Written after every batch, so an interrupted run loses one batch
      // rather than all of them and can simply be run again.
      writeFileSync(file, JSON.stringify(existing, null, 1) + "\n");
      console.log("ok");
    } catch (error) {
      console.log(`failed — ${error.message}`);
    }
  }

  const done = strings.filter((s) => s in existing).length;
  console.log(`${LANGUAGES[lang]}: ${done}/${strings.length} in ${file}`);
}
