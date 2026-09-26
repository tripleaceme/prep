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
    category: "python-data",
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
    category: "pipeline-etl",
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
    category: "pipeline-etl",
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
    category: "data-quality",
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
  {
    kind: "python",
    slug: "py-case-backfill-plan",
    title: "Case study: plan a backfill without melting the warehouse",
    category: "pipeline-etl",
    difficulty: "medium",
    prompt: [
      "A bug in a transform means ninety days of a daily table are wrong. You need to rerun them, but the platform team has told you plainly: no more than five days in flight at a time, or you take production down with you.",
      "Write plan_backfill(start, end, batch_size) returning a list of (first_day, last_day) tuples, each covering at most batch_size days, together covering every day from start to end inclusive.",
      "start and end are ISO date strings, and so are the dates in the tuples you return. Batches run oldest first, because a half-finished backfill should leave the recent data correct.",
      "Return an empty list if end is before start — a backfill of nothing should be a no-op, not a crash at 3am.",
    ],
    starter: `from datetime import date, timedelta


def plan_backfill(start, end, batch_size):
    """Split an inclusive date range into ordered batches of at most batch_size days."""
    # your code here
    return []
`,
    tests: `
out = plan_backfill("2024-01-01", "2024-01-10", 5)
assert out == [("2024-01-01", "2024-01-05"), ("2024-01-06", "2024-01-10")], f"got {out}"

out = plan_backfill("2024-01-01", "2024-01-07", 3)
assert out == [
    ("2024-01-01", "2024-01-03"),
    ("2024-01-04", "2024-01-06"),
    ("2024-01-07", "2024-01-07"),
], f"a ragged final batch should still be returned: {out}"

out = plan_backfill("2024-03-01", "2024-03-01", 5)
assert out == [("2024-03-01", "2024-03-01")], f"a single day is one batch: {out}"

assert plan_backfill("2024-01-10", "2024-01-01", 5) == [], "a reversed range is a no-op"

out = plan_backfill("2024-02-26", "2024-03-02", 2)
assert out == [
    ("2024-02-26", "2024-02-27"),
    ("2024-02-28", "2024-02-29"),
    ("2024-03-01", "2024-03-02"),
], f"2024 is a leap year, so 29 February must appear: {out}"
`,
    hint: "Work in date objects with timedelta and only format back to strings at the end. Watch the inclusive end: a batch covering days 1 to 5 has its last day at first + batch_size - 1.",
  },
  {
    kind: "python",
    slug: "py-case-schema-drift",
    title: "Case study: the upstream team added a column",
    category: "python-data",
    difficulty: "medium",
    prompt: [
      "Your load broke overnight. The upstream service shipped a release, and the JSON it sends now has a new field, has dropped one you depend on, and has changed another from a number to a string.",
      "Write diff_schema(expected, actual) returning a dict describing the drift, so the pipeline can fail with something a human can act on instead of a KeyError.",
      "expected and actual are dicts mapping field name to type name, for example {'id': 'int', 'email': 'str'}.",
      "Return {'added': [...], 'removed': [...], 'changed': [...]} where added lists fields only in actual, removed lists fields only in expected, and changed lists (field, expected_type, actual_type) for fields in both whose type differs. Each list sorted by field name.",
      "The distinction matters operationally: an added field is usually safe to ignore, while a removed or retyped one will corrupt or break the load.",
    ],
    starter: `def diff_schema(expected, actual):
    """Compare two field-to-type maps and describe the drift between them."""
    # your code here
    return {"added": [], "removed": [], "changed": []}
`,
    tests: `
expected = {"id": "int", "email": "str", "amount": "float", "status": "str"}
actual = {"id": "int", "email": "str", "amount": "str", "currency": "str"}

out = diff_schema(expected, actual)
assert out["added"] == ["currency"], f"added: {out['added']}"
assert out["removed"] == ["status"], f"removed: {out['removed']}"
assert out["changed"] == [("amount", "float", "str")], f"changed: {out['changed']}"

same = diff_schema(expected, expected)
assert same == {"added": [], "removed": [], "changed": []}, "identical schemas have no drift"

out = diff_schema({}, {"b": "int", "a": "str"})
assert out["added"] == ["a", "b"], "added must be sorted by field name"

out = diff_schema({"a": "int", "b": "int"}, {})
assert out["removed"] == ["a", "b"], "removed must be sorted by field name"
`,
    hint: "Set operations on the two key sets give you added and removed. For changed, walk the intersection and compare values — then sort each list before returning.",
  },
  {
    kind: "python",
    slug: "py-case-reconcile-counts",
    title: "Case study: source and warehouse disagree",
    category: "python-data",
    difficulty: "medium",
    prompt: [
      "Finance says the warehouse is short. You need a reconciliation check that runs after every load and says which days are wrong and by how much, rather than a single boolean that tells you nothing.",
      "Write reconcile(source_counts, warehouse_counts, tolerance) where both arguments are dicts mapping an ISO date string to a row count.",
      "Return a sorted list of (day, source_count, warehouse_count, difference) for every day where the absolute difference exceeds tolerance. difference is source minus warehouse, so a negative number means the warehouse has too many rows — usually a double load.",
      "A day present in one side and missing from the other counts as zero on the missing side. Silently skipping it is how a whole missing partition goes unnoticed for a week.",
    ],
    starter: `def reconcile(source_counts, warehouse_counts, tolerance=0):
    """Return the days where source and warehouse counts differ by more than tolerance."""
    # your code here
    return []
`,
    tests: `
source = {"2024-05-01": 100, "2024-05-02": 120, "2024-05-03": 90}
warehouse = {"2024-05-01": 100, "2024-05-02": 118, "2024-05-03": 180}

out = reconcile(source, warehouse)
assert out == [("2024-05-02", 120, 118, 2), ("2024-05-03", 90, 180, -90)], f"got {out}"

out = reconcile(source, warehouse, tolerance=5)
assert out == [("2024-05-03", 90, 180, -90)], f"tolerance should absorb the small gap: {out}"

out = reconcile({"2024-05-04": 50}, {})
assert out == [("2024-05-04", 50, 0, 50)], f"a missing warehouse day is a gap, not a skip: {out}"

out = reconcile({}, {"2024-05-05": 7})
assert out == [("2024-05-05", 0, 7, -7)], f"a warehouse-only day is also a gap: {out}"

assert reconcile({}, {}) == [], "nothing to reconcile"
`,
    hint: "Union the two key sets, then use .get(day, 0) on each side so a missing day reads as zero rather than raising.",
  },
  {
    kind: "python",
    slug: "py-case-retry-budget",
    title: "Case study: retry the API without hammering it",
    category: "pipeline-etl",
    difficulty: "hard",
    prompt: [
      "Your extractor calls a vendor API that fails intermittently. The naive fix — retry immediately, forever — got your key rate-limited last month.",
      "Write backoff_delays(attempts, base, cap) returning the list of delays in seconds to wait before each retry, using exponential backoff with a ceiling.",
      "The delay before retry n, counting from 1, is base * 2 ** (n - 1), capped at cap. attempts is the number of retries, so the list has exactly that many entries.",
      "Return an empty list for zero or negative attempts. Then also write should_retry(status) returning True only for status codes worth retrying — 429 and any 5xx — because retrying a 400 or a 401 will never succeed and just burns your budget.",
    ],
    starter: `def backoff_delays(attempts, base=1, cap=60):
    """Delays in seconds before each retry: exponential, ceilinged at cap."""
    # your code here
    return []


def should_retry(status):
    """True only for status codes where a retry could plausibly succeed."""
    # your code here
    return False
`,
    tests: `
assert backoff_delays(4, base=1, cap=60) == [1, 2, 4, 8], f"got {backoff_delays(4)}"
assert backoff_delays(6, base=1, cap=8) == [1, 2, 4, 8, 8, 8], "delays must stop at the cap"
assert backoff_delays(3, base=5, cap=100) == [5, 10, 20], "base scales the whole series"
assert backoff_delays(0) == [], "no retries means no delays"
assert backoff_delays(-2) == [], "a negative count is not an error, it is no retries"

assert should_retry(429) is True, "429 is rate limiting, which a wait fixes"
assert should_retry(500) is True and should_retry(503) is True, "5xx is worth retrying"
assert should_retry(400) is False, "a bad request will stay bad"
assert should_retry(401) is False, "a bad credential will stay bad"
assert should_retry(404) is False, "a missing resource will not appear"
assert should_retry(200) is False, "success needs no retry"
`,
    hint: "min(base * 2 ** i, cap) over a range gives the delays. For should_retry, 429 plus the 500 to 599 range — and return real booleans, since the tests use `is True`.",
  },
  {
    kind: "python",
    slug: "py-parse-log-lines",
    title: "Parse the log file, quarantine the bad lines",
    category: "python-data",
    difficulty: "medium",
    prompt: [
      "An application writes one log line per event and you have been asked to load them into the warehouse. Most lines are well formed. Some are not, and a loader that crashes on line 40,000 of 2 million is worse than useless.",
      "Write `parse_logs(lines)` returning a tuple of two lists: the records that parsed, and the lines that did not.",
      "A good line is `'<date> <time> <LEVEL> <message>'`, for example `'2024-06-11 14:23:01 ERROR db_connection timeout'`. A record is a dict with `timestamp` (the date and time joined by a space), `level` and `message`.",
    ],
    notes: [
      "`level` is one of `DEBUG`, `INFO`, `WARN` or `ERROR`. A line whose fourth field is anything else is not a valid line.",
      "A valid line always has at least four fields. The message is everything after the level and may contain spaces.",
      "Lines may carry leading or trailing whitespace, and blank lines appear. Neither is an error worth reporting — skip blank lines entirely rather than quarantining them.",
      "Return bad lines exactly as they were given, so whoever looks at the quarantine can see what actually arrived.",
    ],
    example: {
      input: `lines = [
    "2024-06-11 14:23:01 ERROR db_connection timeout after 30s",
    "  2024-06-11 14:23:05 INFO request served  ",
    "",
    "2024-06-11 14:24:00 TRACE something",
    "garbage",
]

good, bad = parse_logs(lines)`,
      output: `good = [
    {"timestamp": "2024-06-11 14:23:01",
     "level": "ERROR",
     "message": "db_connection timeout after 30s"},
    {"timestamp": "2024-06-11 14:23:05",
     "level": "INFO",
     "message": "request served"},
]

bad = ["2024-06-11 14:24:00 TRACE something", "garbage"]`,
    },
    explanation:
      "The first two lines parse, and the message keeps its internal spaces while the surrounding whitespace is stripped. The blank line is skipped and appears in neither list, because an empty line is noise rather than a defect worth anybody's attention. The TRACE line is well shaped but its level is not one we accept, so it is quarantined rather than loaded with a level nothing downstream understands. 'garbage' has too few fields. Both bad lines come back exactly as supplied — stripped or repaired versions would hide what the source actually sent.",
    gotcha:
      "Splitting the whole line and taking field four as the message. That truncates every message at its first space, and because the result still looks like a valid record it will load quietly and be discovered weeks later.",
    starter: `def parse_logs(lines):
    """Split log lines into parsed records and quarantined raw lines.

    Returns: (good, bad) where good is a list of dicts with keys
    timestamp, level and message, and bad is a list of the original strings.
    """
    # your code here
    return ([], [])
`,
    tests: `
lines = [
    "2024-06-11 14:23:01 ERROR db_connection timeout after 30s",
    "  2024-06-11 14:23:05 INFO request served  ",
    "",
    "2024-06-11 14:24:00 TRACE something",
    "garbage",
]
good, bad = parse_logs(lines)

assert len(good) == 2, f"expected 2 good records, got {len(good)}"
assert good[0] == {
    "timestamp": "2024-06-11 14:23:01",
    "level": "ERROR",
    "message": "db_connection timeout after 30s",
}, f"got {good[0]}"
assert good[1]["message"] == "request served", f"message must keep inner spaces and lose outer: {good[1]}"
assert bad == ["2024-06-11 14:24:00 TRACE something", "garbage"], f"got {bad}"

g, b = parse_logs([])
assert g == [] and b == [], "empty input gives two empty lists"

g, b = parse_logs(["", "   "])
assert g == [] and b == [], "blank lines are skipped, not quarantined"

g, b = parse_logs(["2024-06-11 14:23:01 WARN disk 91% full"])
assert g[0]["level"] == "WARN" and g[0]["message"] == "disk 91% full"
`,
    hint: "split(maxsplit=3) gives you the four fields you want and leaves the message whole. Check the level against the allowed set before accepting the line.",
  },
  {
    kind: "python",
    slug: "py-flatten-nested-json",
    title: "Flatten the nested JSON for loading",
    category: "python-data",
    difficulty: "medium",
    prompt: [
      "The API returns deeply nested JSON and the warehouse table is flat. You need one column per leaf value before you can load anything.",
      "Write `flatten(record, separator)` turning a nested dict into a flat one, where each key is the path to that value joined by the separator.",
      "Return a dict with no nested dicts in it.",
    ],
    notes: [
      "`separator` defaults to `'.'`, so `{'b': {'c': 2}}` becomes `{'b.c': 2}`.",
      "Nesting can be any depth.",
      "An empty dict as a value has no leaves, so it contributes nothing to the output. It does not become a key with an empty dict attached.",
      "Lists are values, not structures to descend into. Leave a list exactly as it is — flattening lists means inventing an index convention, and the warehouse column can hold the JSON.",
      "Do not modify the dict you were given.",
    ],
    example: {
      input: `flatten({
    "id": 1,
    "user": {
        "name": "Adaeze",
        "address": {"city": "Lagos", "postcode": "101233"},
    },
    "tags": ["a", "b"],
    "meta": {},
})`,
      output: `{
    "id": 1,
    "user.name": "Adaeze",
    "user.address.city": "Lagos",
    "user.address.postcode": "101233",
    "tags": ["a", "b"],
}`,
    },
    explanation:
      "id is already flat and keeps its name. user.address.postcode shows the full path joined, at two levels of nesting. tags stays a list under its original key rather than becoming tags.0 and tags.1 — descending into it would invent a convention the warehouse has not agreed to. meta is absent entirely: an empty dict contains no leaf values, so there is nothing to emit, and a meta key holding an empty dict would defeat the point of flattening.",
    gotcha:
      "Recursing one level and stopping. It handles the example in most job descriptions and silently drops anything deeper, so user.address ends up as a dict inside a supposedly flat record.",
    starter: `def flatten(record, separator="."):
    """Flatten a nested dict into path -> value.

    record:    dict, possibly nested to any depth.
    separator: string joining path segments.
    Returns: a flat dict. Does not modify its argument.
    """
    # your code here
    return {}
`,
    tests: `
out = flatten({
    "id": 1,
    "user": {"name": "Adaeze", "address": {"city": "Lagos", "postcode": "101233"}},
    "tags": ["a", "b"],
    "meta": {},
})
assert out == {
    "id": 1,
    "user.name": "Adaeze",
    "user.address.city": "Lagos",
    "user.address.postcode": "101233",
    "tags": ["a", "b"],
}, f"got {out}"

assert flatten({}) == {}, "an empty record flattens to nothing"
assert flatten({"a": 1}) == {"a": 1}, "an already flat record is unchanged"
assert flatten({"a": {"b": {"c": {"d": 4}}}}) == {"a.b.c.d": 4}, "depth is unbounded"
assert flatten({"a": {"b": 2}}, separator="_") == {"a_b": 2}, "separator is honoured"
assert flatten({"a": None}) == {"a": None}, "None is a value, not a missing key"

source = {"a": {"b": 1}}
flatten(source)
assert source == {"a": {"b": 1}}, "do not mutate the input"
`,
    hint: "Recurse. At each level, if the value is a dict, walk into it carrying the path so far; otherwise emit the joined path and the value.",
  },
  {
    kind: "python",
    slug: "py-sessionise-events",
    title: "Group events into sessions",
    category: "python-data",
    difficulty: "hard",
    prompt: [
      "Product analytics wants sessions, and all you have is a stream of individual events. This is the most commonly asked Python question in data interviews, because almost every event table needs it eventually.",
      "Write `sessionise(events, gap_minutes)` grouping each user's events into sessions.",
      "Return a list of dicts with `user_id`, `start`, `end` and `event_count`, sorted by `user_id` then `start`.",
    ],
    notes: [
      "`events` is a list of dicts with `user_id` and `occurred_at`, an ISO timestamp string. The two returned timestamps are ISO strings too.",
      "A session ends after `gap_minutes` of inactivity: two consecutive events more than that far apart belong to different sessions.",
      "Exactly `gap_minutes` apart is still the same session. Only a strictly larger gap breaks it.",
      "Events arrive in no particular order, and sessions are per user — one user's events never join another's.",
      "A session with one event is still a session; its start and end are the same timestamp.",
    ],
    example: {
      input: `events = [
    {"user_id": 1, "occurred_at": "2024-05-01T09:00:00"},
    {"user_id": 1, "occurred_at": "2024-05-01T09:20:00"},
    {"user_id": 1, "occurred_at": "2024-05-01T10:30:00"},
    {"user_id": 2, "occurred_at": "2024-05-01T11:00:00"},
]

sessionise(events, gap_minutes=30)`,
      output: `[{"user_id": 1, "start": "2024-05-01T09:00:00",
  "end": "2024-05-01T09:20:00", "event_count": 2},
 {"user_id": 1, "start": "2024-05-01T10:30:00",
  "end": "2024-05-01T10:30:00", "event_count": 1},
 {"user_id": 2, "start": "2024-05-01T11:00:00",
  "end": "2024-05-01T11:00:00", "event_count": 1}]`,
    },
    explanation:
      "User 1's first two events are 20 minutes apart, inside the 30-minute gap, so they are one session of two events. The third is 70 minutes after the second, which exceeds the gap, so it starts a new session — one that has a single event, with its start and end the same moment. User 2's single event is its own session, and never joins user 1's despite falling between their two sessions in time, because sessions are per user. Note the gap is measured between consecutive events, not from the start of the session: a user clicking every 20 minutes for six hours is in one long session, not eighteen.",
    gotcha:
      "Measuring the gap from the session's start rather than from the previous event. That cuts a continuously active user into fixed-length blocks, which is not what a session is.",
    starter: `from datetime import datetime, timedelta


def sessionise(events, gap_minutes=30):
    """Group each user's events into sessions.

    events: list of dicts with user_id and occurred_at (ISO string).
    gap_minutes: inactivity that ends a session.
    Returns: list of dicts with user_id, start, end, event_count,
    sorted by user_id then start.
    """
    # your code here
    return []
`,
    tests: `
events = [
    {"user_id": 1, "occurred_at": "2024-05-01T09:00:00"},
    {"user_id": 1, "occurred_at": "2024-05-01T09:20:00"},
    {"user_id": 1, "occurred_at": "2024-05-01T10:30:00"},
    {"user_id": 2, "occurred_at": "2024-05-01T11:00:00"},
]
out = sessionise(events, gap_minutes=30)
assert out == [
    {"user_id": 1, "start": "2024-05-01T09:00:00", "end": "2024-05-01T09:20:00", "event_count": 2},
    {"user_id": 1, "start": "2024-05-01T10:30:00", "end": "2024-05-01T10:30:00", "event_count": 1},
    {"user_id": 2, "start": "2024-05-01T11:00:00", "end": "2024-05-01T11:00:00", "event_count": 1},
], f"got {out}"

assert sessionise([], 30) == [], "no events, no sessions"

shuffled = list(reversed(events))
assert sessionise(shuffled, 30) == out, "input order must not matter"

exact = [
    {"user_id": 1, "occurred_at": "2024-05-01T09:00:00"},
    {"user_id": 1, "occurred_at": "2024-05-01T09:30:00"},
]
assert sessionise(exact, 30)[0]["event_count"] == 2, "exactly gap_minutes apart is the same session"

over = [
    {"user_id": 1, "occurred_at": "2024-05-01T09:00:00"},
    {"user_id": 1, "occurred_at": "2024-05-01T09:30:01"},
]
assert len(sessionise(over, 30)) == 2, "one second over the gap splits the session"

rolling = [
    {"user_id": 1, "occurred_at": "2024-05-01T09:00:00"},
    {"user_id": 1, "occurred_at": "2024-05-01T09:25:00"},
    {"user_id": 1, "occurred_at": "2024-05-01T09:50:00"},
]
assert len(sessionise(rolling, 30)) == 1, "the gap is measured from the previous event, not the session start"
`,
    hint: "Group by user, sort each group by time, then walk the events keeping the previous timestamp. A gap larger than the limit closes the current session and opens a new one.",
  },
];
