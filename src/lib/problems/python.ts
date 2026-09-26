/**
 * Python pipeline problems.
 *
 * Pure standard library on purpose — no pandas. Two reasons: pandas roughly
 * triples what the browser has to download before you can run anything, and
 * the thing being tested here is whether you can reason about records,
 * watermarks and idempotency, not whether you remember the pandas API.
 *
 * `tests` runs after the candidate's code and is not shown until they run it,
 * so the problem gets solved rather than pattern-matched against the checks.
 */

import type { PythonProblem } from "./types";

export const PYTHON_PROBLEMS: PythonProblem[] = [
  {
    kind: "python",
    slug: "py-dedupe-latest",
    title: "Keep the latest record per key",
    category: "python-pipelines",
    difficulty: "easy",
    prompt: [
      "A batch has arrived with the same `customer_id` more than once, each with a different `loaded_at`.",
      "Write `latest_per_customer(rows)` returning one record per customer — the one with the newest `loaded_at` — sorted by `customer_id`.",
      "Each row is a dict with `customer_id`, `email` and `loaded_at` (an ISO string).",
    ],
    starter: `def latest_per_customer(rows):
    """Return one row per customer_id, keeping the newest loaded_at."""
    # your code here
    return []
`,
    tests: `
rows = [
    {"customer_id": 1, "email": "old@a.com",  "loaded_at": "2024-05-01T09:00:00"},
    {"customer_id": 1, "email": "new@a.com",  "loaded_at": "2024-05-04T11:30:00"},
    {"customer_id": 2, "email": "b@b.com",    "loaded_at": "2024-05-02T08:15:00"},
    {"customer_id": 3, "email": "old@c.com",  "loaded_at": "2024-05-01T10:00:00"},
    {"customer_id": 3, "email": "new@c.com",  "loaded_at": "2024-05-06T14:45:00"},
]
out = latest_per_customer(rows)
assert len(out) == 3, f"expected 3 rows, got {len(out)}"
assert [r["customer_id"] for r in out] == [1, 2, 3], "rows must be sorted by customer_id"
assert out[0]["email"] == "new@a.com", "customer 1 should keep the newest email"
assert out[2]["email"] == "new@c.com", "customer 3 should keep the newest email"

assert latest_per_customer([]) == [], "an empty batch should return an empty list"
`,
    hint: "A dict keyed by customer_id, keeping whichever row has the later loaded_at, then sort the values.",
  },
  {
    kind: "python",
    slug: "py-incremental-watermark",
    title: "Pick the rows an incremental load should take",
    category: "python-pipelines",
    difficulty: "medium",
    prompt: [
      "Write `rows_to_load(rows, watermark)` returning the records an incremental run should process.",
      "The trap: filter on `loaded_at`, not `event_date`. Events arrive late — an event dated the 2nd can land on the 5th — and watermarking on the event date silently drops them forever.",
      "Return rows whose `loaded_at` is strictly greater than `watermark`, sorted by `event_id`. A `watermark` of `None` means a first run: take everything.",
    ],
    starter: `def rows_to_load(rows, watermark):
    """Rows newer than the watermark, by load time rather than event time."""
    # your code here
    return []
`,
    tests: `
rows = [
    {"event_id": 1, "event_date": "2024-05-01", "loaded_at": "2024-05-01T23:10:00"},
    {"event_id": 2, "event_date": "2024-05-02", "loaded_at": "2024-05-02T23:10:00"},
    {"event_id": 3, "event_date": "2024-05-03", "loaded_at": "2024-05-03T23:10:00"},
    {"event_id": 4, "event_date": "2024-05-02", "loaded_at": "2024-05-05T06:00:00"},
    {"event_id": 5, "event_date": "2024-05-04", "loaded_at": "2024-05-04T22:45:00"},
    {"event_id": 6, "event_date": "2024-05-01", "loaded_at": "2024-05-06T07:30:00"},
]

out = rows_to_load(rows, "2024-05-03T23:59:59")
ids = [r["event_id"] for r in out]
assert ids == [4, 5, 6], f"expected the late arrivals 4, 5, 6 — got {ids}"

assert [r["event_id"] for r in rows_to_load(rows, None)] == [1, 2, 3, 4, 5, 6], \\
    "a null watermark means a first run: take everything"

assert rows_to_load(rows, "2024-05-06T07:30:00") == [], \\
    "the comparison is strictly greater than, so nothing is reprocessed"
`,
    hint: "Compare loaded_at against the watermark with >, and sort the survivors by event_id.",
  },
  {
    kind: "python",
    slug: "py-idempotent-upsert",
    title: "Make a load idempotent",
    category: "python-pipelines",
    difficulty: "medium",
    prompt: [
      "`upsert(target, batch, key)` merges a batch into an existing table, both lists of dicts.",
      "Rows whose `key` already exists are replaced; new ones are appended. Existing rows the batch doesn't mention are left alone.",
      "It must be idempotent: running the same batch twice leaves exactly the same result as running it once. Return the table sorted by `key`, and don't mutate `target`.",
    ],
    starter: `def upsert(target, batch, key):
    """Merge batch into target on the given key: replace matches, append the rest."""
    # your code here
    return []
`,
    tests: `
target = [
    {"id": 1, "name": "Adaeze", "tier": "bronze"},
    {"id": 2, "name": "Tunde",  "tier": "silver"},
]
batch = [
    {"id": 2, "name": "Tunde", "tier": "gold"},
    {"id": 3, "name": "Wei",   "tier": "bronze"},
]

once = upsert(target, batch, "id")
assert [r["id"] for r in once] == [1, 2, 3], "result must be sorted by key"
assert once[1]["tier"] == "gold", "an existing key should be replaced by the batch"
assert once[0]["tier"] == "bronze", "rows the batch doesn't mention are untouched"

twice = upsert(once, batch, "id")
assert twice == once, "running the same batch twice must change nothing — it is not idempotent"

assert target[1]["tier"] == "silver", "upsert must not mutate the table it was given"
`,
    hint: "Build a dict from target keyed by `key`, overwrite with the batch, then sort the values. Copy rather than mutating what you were handed.",
  },
  {
    kind: "python",
    slug: "py-data-quality-checks",
    title: "Run the data quality checks",
    category: "python-pipelines",
    difficulty: "hard",
    prompt: [
      "Write `run_checks(rows)` returning a list of failures — one dict per problem found, each with `check` and `row_id`.",
      "Three checks, reported in this order for each row before moving to the next: `not_null_email` when `email` is missing, empty or whitespace; `positive_amount` when `amount` is not greater than zero; `known_status` when `status` isn't one of `completed`, `pending` or `cancelled`.",
      "A single row can fail more than one check. Return an empty list when everything passes.",
    ],
    starter: `VALID_STATUSES = {"completed", "pending", "cancelled"}

def run_checks(rows):
    """Return a list of {"check": ..., "row_id": ...} for every failure found."""
    # your code here
    return []
`,
    tests: `
rows = [
    {"row_id": 1, "email": "a@b.com", "amount": 10.0, "status": "completed"},
    {"row_id": 2, "email": "",        "amount": 5.0,  "status": "pending"},
    {"row_id": 3, "email": "c@d.com", "amount": 0.0,  "status": "refunded"},
    {"row_id": 4, "email": "   ",     "amount": -2.0, "status": "nonsense"},
]

out = run_checks(rows)
pairs = [(f["check"], f["row_id"]) for f in out]

assert ("not_null_email", 2) in pairs, "row 2 has an empty email"
assert ("positive_amount", 3) in pairs, "row 3 has an amount of zero"
assert ("known_status", 3) in pairs, "row 3 has an unknown status"
assert pairs.count(("not_null_email", 1)) == 0, "row 1 passes every check"
assert len([p for p in pairs if p[1] == 4]) == 3, "row 4 fails all three checks"
assert pairs == sorted(pairs, key=lambda p: p[1]), "report failures row by row, in order"

assert run_checks([rows[0]]) == [], "a clean batch reports nothing"
`,
    hint: "Loop the rows, and within each row run the three checks in the order given, appending a dict per failure.",
  },
];
