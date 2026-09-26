/**
 * Orchestration problems.
 *
 * Deliberately not "write an Airflow DAG". Airflow's decorators are a few
 * minutes of documentation; what interviews actually probe is the reasoning
 * underneath — what order can these tasks run in, what is safe to run twice,
 * which window does a run cover, and what happens when one fails.
 *
 * All of it is plain Python, so it runs in the browser and stays true whether
 * the job ends up in Airflow, Dagster, Prefect or a cron file.
 *
 * Every problem here states its input shape in full, shows a worked example
 * with its output, and says why that output is right. An earlier version did
 * none of that and one question even referred to "the same dependency dict"
 * from a problem you might never have opened — which made it a riddle rather
 * than an exercise.
 */

import type { PythonProblem } from "./types";

/** The shape every dependency question uses, described once. */
const DAG_SHAPE =
  "`tasks` is a dict mapping each task name to a list of the task names it depends on. A task with no dependencies maps to an empty list. Every name that appears as a dependency also appears as a key.";

export const ORCHESTRATION_PROBLEMS: PythonProblem[] = [
  {
    kind: "python",
    slug: "orc-task-order",
    title: "Run the tasks in the right order",
    category: "orchestration",
    difficulty: "medium",
    prompt: [
      "You are writing the scheduler for a small pipeline. It is handed a set of tasks and which tasks each one depends on, and it has to decide what order to run them in.",
      "Write `run_order(tasks)`, returning a list of task names ordered so that every task appears after everything it depends on.",
      "Output a list of strings containing each task exactly once.",
    ],
    notes: [
      DAG_SHAPE,
      "When several tasks are ready at the same time, take them in alphabetical order. A scheduler that returns a different valid order on each run is miserable to debug, so the tie-break is part of the answer.",
      "An empty `tasks` dict returns an empty list.",
      "You can assume there are no cycles. Detecting those is the next problem.",
    ],
    example: {
      input: `tasks = {
    "load_orders":       ["extract_orders"],
    "extract_orders":    [],
    "report":            ["load_orders", "load_customers"],
    "load_customers":    ["extract_customers"],
    "extract_customers": [],
}`,
      output: `["extract_customers",
 "extract_orders",
 "load_customers",
 "load_orders",
 "report"]`,
    },
    explanation:
      "Both extract tasks have no dependencies, so they are ready first and alphabetical order puts extract_customers ahead of extract_orders. Once both have run, load_customers and load_orders become ready together and are ordered alphabetically too. report depends on both loads, so it cannot appear until they have both been placed — which is why it is last even though it comes before the two load tasks alphabetically.",
    gotcha:
      "Sorting the task names alphabetically and returning them. That happens to look plausible on small examples but ignores the dependencies entirely — here it would put load_customers before extract_customers.",
    starter: `def run_order(tasks):
    """Order the tasks so each one runs after everything it depends on.

    tasks: dict of task name -> list of task names it depends on.
    Returns: list of task names.
    """
    # your code here
    return []
`,
    tests: `
dag = {
    "load_orders": ["extract_orders"],
    "extract_orders": [],
    "report": ["load_orders", "load_customers"],
    "load_customers": ["extract_customers"],
    "extract_customers": [],
}
out = run_order(dag)
assert sorted(out) == sorted(dag), f"every task must appear exactly once: {out}"
for task, deps in dag.items():
    for dep in deps:
        assert out.index(dep) < out.index(task), f"{dep} must come before {task}"

assert out == [
    "extract_customers",
    "extract_orders",
    "load_customers",
    "load_orders",
    "report",
], f"ties break alphabetically: {out}"

assert run_order({}) == [], "an empty DAG has an empty order"
assert run_order({"a": [], "b": [], "c": []}) == ["a", "b", "c"], "independent tasks sort alphabetically"

chain = {"c": ["b"], "b": ["a"], "a": []}
assert run_order(chain) == ["a", "b", "c"], "a straight chain has one valid order"
`,
    hint: "Repeatedly collect the tasks whose dependencies have all been placed already, sort that batch alphabetically, and append it. Keep a set of what is done and a dict of what is left.",
  },
  {
    kind: "python",
    slug: "orc-detect-cycle",
    title: "Reject a pipeline that can never run",
    category: "orchestration",
    difficulty: "medium",
    prompt: [
      "Someone edits the pipeline and adds a dependency that closes a loop: A waits for B, B waits for C, and C waits for A. None of them can ever start.",
      "Depending on the scheduler this either hangs or fails at 3am with an unhelpful message, so you want to catch it when the pipeline is defined instead.",
      "Write `has_cycle(tasks)`, returning `True` if any chain of dependencies leads back to where it started, and `False` otherwise.",
    ],
    notes: [
      DAG_SHAPE,
      "A task that lists itself as a dependency is a cycle — it can never start, which is the same failure.",
      "A loop can be any length: two tasks waiting on each other, or twenty.",
      "Two tasks both depending on a third is *not* a cycle. That is a diamond, and it is a perfectly normal shape.",
    ],
    example: {
      input: `has_cycle({"a": ["b"], "b": ["c"], "c": ["a"]})
has_cycle({"a": [], "b": ["a"], "c": ["a"], "d": ["b", "c"]})`,
      output: `True
False`,
    },
    explanation:
      "In the first, following a's dependencies reaches b, then c, and c depends on a again — back where the walk started, so nothing in that loop can ever run. The second looks similar because d has two paths into a, but following any chain from d ends at a, which depends on nothing. Reaching the same task twice by two different routes is not a cycle; only returning to a task that is still on the current path is.",
    gotcha:
      "Checking only whether two tasks depend on each other directly. That catches {\"a\": [\"b\"], \"b\": [\"a\"]} and misses every loop longer than two, which is most of the ones that happen in practice.",
    starter: `def has_cycle(tasks):
    """True if the dependency graph contains a cycle.

    tasks: dict of task name -> list of task names it depends on.
    Returns: bool.
    """
    # your code here
    return False
`,
    tests: `
assert has_cycle({"a": [], "b": ["a"]}) is False, "a normal chain has no cycle"
assert has_cycle({}) is False, "an empty graph has no cycle"
assert has_cycle({"a": ["b"], "b": ["a"]}) is True, "two tasks depending on each other"
assert has_cycle({"a": ["a"]}) is True, "a task depending on itself"
assert has_cycle({"a": ["b"], "b": ["c"], "c": ["a"]}) is True, "a longer loop"
assert has_cycle({"a": [], "b": ["a"], "c": ["a"], "d": ["b", "c"]}) is False, "a diamond is not a cycle"

deep = {f"t{i}": [f"t{i+1}"] for i in range(50)}
deep["t50"] = []
assert has_cycle(deep) is False, "a long chain is not a cycle"
`,
    hint: "Walk the dependencies from each task, keeping the set of tasks on the path you are currently following. Meeting one that is already on that path is a cycle; meeting one you have finished exploring is not.",
  },
  {
    kind: "python",
    slug: "orc-schedule-window",
    title: "Which day does tonight's run process?",
    category: "orchestration",
    difficulty: "medium",
    prompt: [
      "A daily job runs at 02:00 and loads the previous day's data. The run that starts at 02:00 on the 5th processes the 4th — not the 5th, which has barely begun.",
      "Getting this backwards is how a pipeline ends up permanently one day out, and it is asked often because almost everyone does it once.",
      "Write `window_for(run_at, hours)` returning the `(start, end)` the run should process: the period of length `hours` ending at the moment the run starts.",
      "Then write `covers(window, event_at)` returning `True` if an event belongs in that window.",
    ],
    notes: [
      "`run_at` and `event_at` are ISO timestamp strings like `'2024-05-05T02:00:00'`, and the two values you return are ISO strings too.",
      "`start` is inclusive and `end` is exclusive. That is the convention that stops an event landing exactly on the boundary from being counted by two runs.",
      "`hours` defaults to 24 but can be any number of hours.",
    ],
    example: {
      input: `window_for("2024-05-05T02:00:00", 24)

w = window_for("2024-05-05T02:00:00", 24)
covers(w, "2024-05-04T02:00:00")
covers(w, "2024-05-05T02:00:00")`,
      output: `("2024-05-04T02:00:00", "2024-05-05T02:00:00")

True
False`,
    },
    explanation:
      "The run starts at 02:00 on the 5th, so the 24 hours it covers ran from 02:00 on the 4th up to that moment. An event at exactly 02:00 on the 4th is inside, because the start is inclusive. An event at exactly 02:00 on the 5th is not, because the end is exclusive — it belongs to tomorrow's run, and counting it in both is how a daily total ends up slightly too high.",
    gotcha:
      "Returning the day the job runs on rather than the day it processes. It looks right in testing, because you are usually running it by hand on the day you are looking at, and it puts every figure one day out in production.",
    starter: `from datetime import datetime, timedelta


def window_for(run_at, hours=24):
    """The (start, end) a run beginning at run_at should process.

    run_at: ISO timestamp string.
    Returns: (start, end) as ISO timestamp strings.
    """
    # your code here
    return ("", "")


def covers(window, event_at):
    """True if event_at falls in window: start inclusive, end exclusive."""
    # your code here
    return False
`,
    tests: `
w = window_for("2024-05-05T02:00:00", 24)
assert w == ("2024-05-04T02:00:00", "2024-05-05T02:00:00"), f"got {w}"

w6 = window_for("2024-05-05T12:00:00", 6)
assert w6 == ("2024-05-05T06:00:00", "2024-05-05T12:00:00"), f"got {w6}"

w = window_for("2024-03-01T02:00:00", 24)
assert w == ("2024-02-29T02:00:00", "2024-03-01T02:00:00"), "2024 is a leap year"

win = window_for("2024-05-05T02:00:00", 24)
assert covers(win, "2024-05-04T02:00:00") is True, "the start is inclusive"
assert covers(win, "2024-05-04T23:59:59") is True, "inside the window"
assert covers(win, "2024-05-05T02:00:00") is False, "the end is exclusive"
assert covers(win, "2024-05-03T23:00:00") is False, "before the window"
`,
    hint: "datetime.fromisoformat parses and .isoformat() formats. The start is run_at minus the interval; for covers, the test is start <= event < end.",
  },
  {
    kind: "python",
    slug: "orc-failed-downstream",
    title: "Tell people what the failure blocked",
    category: "orchestration",
    difficulty: "hard",
    prompt: [
      "A task fails overnight. The alert already tells you which one. What it does not tell you — and what everyone waiting on the numbers actually wants to know — is which other tasks cannot run now because of it.",
      "Write `blocked_by(tasks, failed)` returning every task that cannot run because `failed` did not complete.",
      "Output a sorted list of task names.",
    ],
    notes: [
      DAG_SHAPE,
      "Blocking is indirect as well as direct. If `report` depends on `join_orders` and `join_orders` depends on the failed task, `report` is blocked too.",
      "The failed task itself is not in the list. It did not run, but it is not waiting on anything.",
      "Tasks that do not depend on the failed one are unaffected and must not appear, even if they normally run later in the night.",
    ],
    example: {
      input: `tasks = {
    "extract_orders":    [],
    "extract_customers": [],
    "load_orders":       ["extract_orders"],
    "load_customers":    ["extract_customers"],
    "join_orders":       ["load_orders", "load_customers"],
    "report":            ["join_orders"],
    "unrelated":         [],
}

blocked_by(tasks, "extract_orders")`,
      output: `["join_orders", "load_orders", "report"]`,
    },
    explanation:
      "load_orders depends on the failed task directly. join_orders depends on load_orders, and report depends on join_orders, so both are blocked through the chain. load_customers is absent because its own branch ran fine, and unrelated is absent because nothing connects it to the failure — reporting those two as blocked would send people chasing problems that do not exist. extract_orders itself is excluded because it is the failure, not a casualty of it.",
    gotcha:
      "Returning only the tasks that name the failed one directly. On this example that gives just load_orders, and the person waiting on report is told nothing.",
    starter: `def blocked_by(tasks, failed):
    """Every task that cannot run because 'failed' did not complete.

    tasks:  dict of task name -> list of task names it depends on.
    failed: the name of the task that failed.
    Returns: sorted list of task names, excluding 'failed' itself.
    """
    # your code here
    return []
`,
    tests: `
dag = {
    "extract_orders": [],
    "extract_customers": [],
    "load_orders": ["extract_orders"],
    "load_customers": ["extract_customers"],
    "join_orders": ["load_orders", "load_customers"],
    "report": ["join_orders"],
    "unrelated": [],
}

out = blocked_by(dag, "extract_orders")
assert out == ["join_orders", "load_orders", "report"], f"got {out}"

out = blocked_by(dag, "load_customers")
assert out == ["join_orders", "report"], f"got {out}"

assert blocked_by(dag, "report") == [], "nothing depends on the last task"
assert blocked_by(dag, "unrelated") == [], "nothing depends on an isolated task"
assert "extract_orders" not in blocked_by(dag, "extract_orders"), "the failed task is not blocked by itself"
`,
    hint: "The dict maps a task to what it needs. You need the opposite — what needs this task. Build that reversed map once, then walk outwards from the failed task collecting everything you reach.",
  },
  {
    kind: "python",
    slug: "orc-missing-partitions",
    title: "Find the days that never landed",
    category: "orchestration",
    difficulty: "medium",
    prompt: [
      "Before you can backfill anything you have to know what is actually missing. A pipeline that has run for months will have gaps nobody logged — a paused scheduler, a run someone cleared, a day the source returned nothing.",
      "Write `missing_days(start, end, present)` returning the days in the range that have no partition.",
      "Output a list of ISO date strings, sorted oldest first.",
    ],
    notes: [
      "`start` and `end` are ISO date strings like `'2024-05-01'`, and the range includes both of them.",
      "`present` is whatever the warehouse reports. It is not sorted, may contain the same day twice, and may contain days outside the range — treat all three as normal rather than as errors.",
      "If `end` is before `start` the range is empty, so return an empty list.",
    ],
    example: {
      input: `missing_days(
    "2024-05-01",
    "2024-05-05",
    ["2024-05-05", "2024-05-01", "2024-05-03", "2024-05-01"],
)`,
      output: `["2024-05-02", "2024-05-04"]`,
    },
    explanation:
      "The range covers the 1st to the 5th. The 1st, 3rd and 5th are present, so the 2nd and 4th are missing. The input is unsorted and lists the 1st twice, neither of which changes the answer — the duplicate is still just one day that landed, and the result comes back in date order regardless of the order it arrived in.",
    gotcha:
      "Comparing lengths — five days expected, four values present, so one is missing. That tells you a day is missing without telling you which, and a duplicate in `present` makes even the count wrong.",
    starter: `from datetime import date, timedelta


def missing_days(start, end, present):
    """The days in [start, end] that have no partition.

    start, end: ISO date strings; the range includes both.
    present:    ISO date strings, unsorted, possibly with duplicates
                or days outside the range.
    Returns: sorted list of ISO date strings.
    """
    # your code here
    return []
`,
    tests: `
out = missing_days("2024-05-01", "2024-05-05", ["2024-05-01", "2024-05-03", "2024-05-05"])
assert out == ["2024-05-02", "2024-05-04"], f"got {out}"

out = missing_days("2024-05-01", "2024-05-03", [])
assert out == ["2024-05-01", "2024-05-02", "2024-05-03"], "nothing present means everything missing"

out = missing_days("2024-05-01", "2024-05-03", ["2024-05-03", "2024-05-01", "2024-05-02"])
assert out == [], "unsorted input is still complete"

out = missing_days("2024-05-01", "2024-05-02", ["2024-05-01", "2024-05-01"])
assert out == ["2024-05-02"], "duplicates in present are harmless"

out = missing_days("2024-05-02", "2024-05-03", ["2024-04-01", "2024-05-02", "2024-12-25"])
assert out == ["2024-05-03"], "days outside the range are ignored"

assert missing_days("2024-05-05", "2024-05-01", []) == [], "a reversed range is empty"
`,
    hint: "Build the full range as a set of ISO strings and subtract the set of present days. Sets handle the duplicates and the out-of-range values for free; sort what is left.",
  },
  {
    kind: "python",
    slug: "orc-idempotent-merge",
    title: "Make the rerun safe",
    category: "orchestration",
    difficulty: "hard",
    prompt: [
      "The most valuable property a task can have is that running it twice leaves the same result as running it once. Without it, every retry is a decision and every backfill is a risk.",
      "Write `merge_partition(existing, incoming, key)` returning the table's state after loading `incoming` into `existing`.",
      "Output a list of rows sorted by `key`.",
    ],
    notes: [
      "`existing` and `incoming` are lists of dicts. `key` names the column that identifies a row, and defaults to `'id'`.",
      "A row in `incoming` whose key is already in `existing` replaces it. A row with a new key is added.",
      "A row in `existing` that `incoming` does not mention is left alone. That is what makes this a merge rather than a replace, and it is the part most people drop.",
      "Do not modify the lists or dicts you were given. A task that edits its input behaves differently the second time it runs, which is the exact property this problem is about.",
    ],
    example: {
      input: `existing = [{"id": 1, "amount": 100}, {"id": 2, "amount": 200}]
incoming = [{"id": 2, "amount": 250}, {"id": 3, "amount": 300}]

merge_partition(existing, incoming)`,
      output: `[{"id": 1, "amount": 100},
 {"id": 2, "amount": 250},
 {"id": 3, "amount": 300}]`,
    },
    explanation:
      "Row 2 arrives again with a new amount, so the incoming version wins and 200 becomes 250. Row 3 is new and is added. Row 1 is not mentioned in the batch at all and survives untouched — dropping it would be the difference between a merge and a replace. Run the same merge on that result with the same batch and nothing changes, which is the property being tested.",
    gotcha:
      "Returning `existing + incoming`. It passes a glance and produces two rows with id 2 — and running it twice produces four, which is precisely the failure that makes people frightened of retries.",
    starter: `def merge_partition(existing, incoming, key="id"):
    """Upsert incoming into existing on key, and return the new state.

    existing, incoming: lists of dicts.
    key: the column identifying a row.
    Returns: list of dicts sorted by key. Does not modify its arguments.
    """
    # your code here
    return []
`,
    tests: `
existing = [
    {"id": 1, "amount": 100},
    {"id": 2, "amount": 200},
]
incoming = [
    {"id": 2, "amount": 250},
    {"id": 3, "amount": 300},
]

out = merge_partition(existing, incoming)
assert out == [
    {"id": 1, "amount": 100},
    {"id": 2, "amount": 250},
    {"id": 3, "amount": 300},
], f"got {out}"

twice = merge_partition(merge_partition(existing, incoming), incoming)
assert twice == out, "running it twice must equal running it once"

assert merge_partition([], incoming) == [
    {"id": 2, "amount": 250},
    {"id": 3, "amount": 300},
], "an empty table just takes the incoming rows"

assert merge_partition(existing, []) == [
    {"id": 1, "amount": 100},
    {"id": 2, "amount": 200},
], "an empty batch changes nothing"

other = merge_partition(
    [{"sku": "a", "n": 1}], [{"sku": "a", "n": 2}, {"sku": "b", "n": 9}], key="sku"
)
assert other == [{"sku": "a", "n": 2}, {"sku": "b", "n": 9}], f"key must be honoured: {other}"

before = [{"id": 1, "amount": 100}]
merge_partition(before, [{"id": 1, "amount": 999}])
assert before == [{"id": 1, "amount": 100}], "do not mutate the input"
`,
    hint: "A dict keyed by the key column, built from existing and then updated from incoming, gives replace-or-insert in one step. Copy each row as you go and sort the values at the end.",
  },
];
