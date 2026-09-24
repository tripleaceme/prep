"use client";

import type * as duckdb from "@duckdb/duckdb-wasm";

/**
 * In-browser SQL engine for Coding Problems.
 *
 * The reference product runs submissions on a server behind a quota. We don't:
 * DuckDB compiled to WebAssembly runs the query on the user's own machine, so
 * problems cost nothing, need no AI key, work offline once cached, and there is
 * no quota to hit. DuckDB also has real window-function support, which is the
 * whole point of the advanced SQL set.
 */

let instance: duckdb.AsyncDuckDB | null = null;
let loading: Promise<duckdb.AsyncDuckDB> | null = null;

async function createDatabase(): Promise<duckdb.AsyncDuckDB> {
  const duckdb = await import("@duckdb/duckdb-wasm");

  // Bundles are served from jsDelivr rather than vendored, so the 30MB+ of
  // wasm never enters the Vercel deployment.
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());

  // The worker script must be same-origin, so it is wrapped in a blob that
  // simply imports the CDN script.
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {
      type: "text/javascript",
    }),
  );

  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);

  return db;
}

export async function getDatabase(): Promise<duckdb.AsyncDuckDB> {
  if (instance) return instance;
  loading ??= createDatabase().then((db) => {
    instance = db;
    return db;
  });
  return loading;
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
}

/**
 * Runs `setupSql` then `query` on a fresh connection, so each attempt starts
 * from the same clean fixture regardless of what the previous one did.
 */
export async function runQuery(
  setupSql: string,
  query: string,
): Promise<QueryResult> {
  const db = await getDatabase();
  const connection = await db.connect();

  try {
    await connection.query(setupSql);
    const table = await connection.query(query);

    const columns = table.schema.fields.map((field) => field.name);
    const rows = table.toArray().map((row) => {
      const object = row.toJSON() as Record<string, unknown>;
      return columns.map((column) => normalise(object[column]));
    });

    return { columns, rows };
  } finally {
    await connection.close();
  }
}

/**
 * DuckDB returns BigInt for integers and Arrow objects for dates, neither of
 * which compares or renders usefully.
 */
function normalise(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value ?? null;
}

/** Compares a candidate result against the expected one. */
export function resultsMatch(
  expected: QueryResult,
  actual: QueryResult,
  orderMatters: boolean,
): { ok: true } | { ok: false; reason: string } {
  if (expected.columns.length !== actual.columns.length) {
    return {
      ok: false,
      reason: `Expected ${expected.columns.length} column${expected.columns.length === 1 ? "" : "s"}, got ${actual.columns.length}.`,
    };
  }
  if (expected.rows.length !== actual.rows.length) {
    return {
      ok: false,
      reason: `Expected ${expected.rows.length} row${expected.rows.length === 1 ? "" : "s"}, got ${actual.rows.length}.`,
    };
  }

  // Column *names* are not compared — an alias shouldn't fail a correct answer.
  const serialise = (rows: unknown[][]) =>
    rows.map((row) => JSON.stringify(row.map(loosen)));

  const expectedRows = serialise(expected.rows);
  const actualRows = serialise(actual.rows);

  if (!orderMatters) {
    expectedRows.sort();
    actualRows.sort();
  }

  for (let i = 0; i < expectedRows.length; i++) {
    if (expectedRows[i] !== actualRows[i]) {
      return {
        ok: false,
        reason: orderMatters
          ? `Row ${i + 1} doesn't match. Check your ordering as well as your values.`
          : `A row doesn't match. Expected ${expectedRows[i]}, got ${actualRows[i]}.`,
      };
    }
  }

  return { ok: true };
}

/** 3 and 3.0 are the same answer; 3.14159 and 3.14160 are not. */
function loosen(value: unknown): unknown {
  if (typeof value === "number") return Math.round(value * 1e6) / 1e6;
  return value;
}
