/**
 * Turns a problem's setup SQL into something that can be rendered as a table.
 *
 * Showing people the raw CREATE and INSERT statements is showing them the
 * plumbing. What you need while solving a question is the shape of the data —
 * the columns, and enough rows to reason about edge cases — which is what
 * every established practice site puts on screen.
 *
 * This is not a SQL parser and does not try to be. It reads exactly the two
 * statements these fixtures are written with, and returns nothing for anything
 * else, so an unusual fixture degrades to no preview rather than to a wrong
 * one.
 */

export interface FixtureTable {
  name: string;
  columns: { name: string; type: string }[];
  rows: string[][];
}

/**
 * Splits on top-level commas only.
 *
 * Needed because both halves of a fixture nest commas: `DECIMAL(10,2)` in a
 * column list, and quoted strings that may contain a comma in a row.
 */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let current = "";

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quoted) {
      current += char;
      // '' is an escaped quote inside a SQL string, not the end of one.
      if (char === "'" && input[i + 1] === "'") {
        current += input[i + 1];
        i += 1;
      } else if (char === "'") {
        quoted = false;
      }
      continue;
    }

    if (char === "'") {
      quoted = true;
      current += char;
    } else if (char === "(") {
      depth += 1;
      current += char;
    } else if (char === ")") {
      depth -= 1;
      current += char;
    } else if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** `DATE '2024-01-05'` reads as a date; `'2024-01-05'` reads the same way. */
function displayValue(raw: string): string {
  const value = raw.trim();

  const typed = value.match(/^(?:DATE|TIMESTAMP|TIME)\s+'([\s\S]*)'$/i);
  if (typed) return typed[1];

  if (/^'[\s\S]*'$/.test(value)) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  if (/^null$/i.test(value)) return "NULL";
  if (/^true$/i.test(value)) return "true";
  if (/^false$/i.test(value)) return "false";

  return value;
}

/** Finds the index of the `)` matching the `(` at `open`, ignoring quotes. */
function matchingParen(sql: string, open: number): number {
  let depth = 0;
  let quoted = false;

  for (let i = open; i < sql.length; i += 1) {
    const char = sql[i];

    if (quoted) {
      if (char === "'" && sql[i + 1] === "'") i += 1;
      else if (char === "'") quoted = false;
      continue;
    }

    if (char === "'") quoted = true;
    else if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

export function parseFixture(sql: string): FixtureTable[] {
  const tables = new Map<string, FixtureTable>();

  // --- columns, from each CREATE TABLE ---
  const createRe = /CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)\s*\(/gi;
  let create: RegExpExecArray | null;

  while ((create = createRe.exec(sql)) !== null) {
    const open = createRe.lastIndex - 1;
    const close = matchingParen(sql, open);
    if (close === -1) continue;

    const name = create[1].replace(/"/g, "");
    const columns = splitTopLevel(sql.slice(open + 1, close))
      // Skip table-level constraints, which are not columns.
      .filter((part) => !/^(primary|foreign|unique|constraint|key|check)\b/i.test(part))
      .map((part) => {
        const [first, ...rest] = part.split(/\s+/);
        return { name: first.replace(/"/g, ""), type: rest.join(" ") };
      })
      .filter((column) => column.name);

    tables.set(name, { name, columns, rows: [] });
  }

  // --- rows, from each INSERT ---
  const insertRe = /INSERT\s+INTO\s+([\w."]+)\s*(?:\([^)]*\))?\s*VALUES\s*/gi;
  let insert: RegExpExecArray | null;

  while ((insert = insertRe.exec(sql)) !== null) {
    const table = tables.get(insert[1].replace(/"/g, ""));
    if (!table) continue;

    // Everything up to the statement's semicolon — found by scanning rather
    // than by indexOf, so a semicolon inside a quoted value doesn't end it.
    let end = insert.index + insert[0].length;
    let quoted = false;
    while (end < sql.length) {
      const char = sql[end];
      if (quoted) {
        if (char === "'" && sql[end + 1] === "'") end += 1;
        else if (char === "'") quoted = false;
      } else if (char === "'") {
        quoted = true;
      } else if (char === ";") {
        break;
      }
      end += 1;
    }

    for (const tuple of splitTopLevel(sql.slice(insert.index + insert[0].length, end))) {
      const trimmed = tuple.trim();
      if (!trimmed.startsWith("(")) continue;
      const close = matchingParen(trimmed, 0);
      if (close === -1) continue;
      table.rows.push(
        splitTopLevel(trimmed.slice(1, close)).map(displayValue),
      );
    }
  }

  // A table with columns but no rows is still worth showing — it tells you the
  // shape. A parse that found nothing at all is not.
  return [...tables.values()].filter((table) => table.columns.length > 0);
}
