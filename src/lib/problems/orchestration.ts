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
 */

import type { PythonProblem } from "./types";

export const ORCHESTRATION_PROBLEMS: PythonProblem[] = [
  {
    kind: "python",
    slug: "orc-task-order",
    title: "What order can these tasks run in?",
    category: "orchestration",
    difficulty: "medium",
    prompt: [
      "A DAG is a dependency graph, and the scheduler's first job is turning that graph into an order. Write the function that does it.",
      "Write run_order(tasks) taking a dict mapping each task to the list of tasks it depends on, and returning a list where every task appears after everything it depends on.",
      "Where several tasks are ready at once, take them in alphabetical order — a scheduler that returns a different valid order each run is miserable to debug.",
      "This is a topological sort, and it is the single most common orchestration interview question.",
    ],
    starter: `def run_order(tasks):
    """Return the tasks in an order that respects their dependencies."""
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
assert sorted(out) == sorted(dag), f"every task must appear once: {out}"
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
    hint: "Repeatedly take the tasks whose dependencies are all already placed, choosing the alphabetically first each time. A dict of remaining tasks plus a set of what is done is enough.",
  },
  {
    kind: "python",
    slug: "orc-detect-cycle",
    title: "The DAG that isn't acyclic",
    category: "orchestration",
    difficulty: "medium",
    prompt: [
      "Someone adds a dependency that closes a loop, and the scheduler either refuses to start or hangs forever. Catching it at definition time is the difference between a clear error and a 3am page.",
      "Write has_cycle(tasks), taking the same dependency dict, and returning True if any chain of dependencies leads back to where it started.",
      "A task depending on itself counts. So does a chain of any length.",
    ],
    starter: `def has_cycle(tasks):
    """True if the dependency graph contains a cycle."""
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
    hint: "Walk from each task, keeping the set of tasks on the current path. Meeting something already on the path is a cycle; meeting something fully explored is not.",
  },
  {
    kind: "python",
    slug: "orc-schedule-window",
    title: "Which window does this run cover?",
    category: "orchestration",
    difficulty: "medium",
    prompt: [
      "A daily job that runs at 02:00 on the 5th processes the 4th, not the 5th. Getting this backwards is how a pipeline ends up permanently one day out, and it is a favourite interview question because almost everyone gets it wrong once.",
      "Write window_for(run_at, hours) returning the (start, end) the run should process: the period of length hours that ended when the run started.",
      "run_at is an ISO timestamp string and both returned values are ISO timestamp strings. start is inclusive, end is exclusive — the convention that stops a row at the boundary being counted twice.",
      "Then write covers(window, event_at) returning True if that event belongs in that window, respecting the same inclusive-start, exclusive-end rule.",
    ],
    starter: `from datetime import datetime, timedelta


def window_for(run_at, hours=24):
    """The (start, end) a run beginning at run_at should process."""
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
    hint: "datetime.fromisoformat parses, .isoformat() formats, and the start is simply run_at minus the interval. For covers, start <= event < end.",
  },
  {
    kind: "python",
    slug: "orc-failed-downstream",
    title: "What else can't run now?",
    category: "orchestration",
    difficulty: "hard",
    prompt: [
      "A task fails. The useful question is not which task failed — the alert already says that — but what is now unrunnable because of it, because that is what you tell the people waiting on the numbers.",
      "Write blocked_by(tasks, failed) returning the sorted list of every task that transitively depends on failed. The failed task itself is not in the list.",
      "Tasks that don't depend on it are unaffected and must not appear, even if they run later.",
    ],
    starter: `def blocked_by(tasks, failed):
    """Every task that cannot run because failed did not complete."""
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
    hint: "Invert the graph so you can look up dependents, then walk outwards from the failed task collecting everything you reach.",
  },
  {
    kind: "python",
    slug: "orc-missing-partitions",
    title: "Which days never landed?",
    category: "orchestration",
    difficulty: "medium",
    prompt: [
      "Before backfilling, you need to know what is actually missing. A pipeline that has run for months will have gaps nobody logged — a paused scheduler, a failed run someone cleared, a day the source returned nothing.",
      "Write missing_days(start, end, present) returning the ISO dates between start and end inclusive that are not in present.",
      "present is whatever the warehouse reports and cannot be trusted to be sorted, deduplicated, or inside the range. Return the missing days sorted, oldest first.",
    ],
    starter: `from datetime import date, timedelta


def missing_days(start, end, present):
    """The days in [start, end] with no partition."""
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
    hint: "Build the full range as a set of ISO strings, subtract the set of present days, and sort what is left. Sets handle the duplicates and the out-of-range days for free.",
  },
  {
    kind: "python",
    slug: "orc-idempotent-merge",
    title: "Make the rerun safe",
    category: "orchestration",
    difficulty: "hard",
    prompt: [
      "The single most valuable property a task can have is that running it twice leaves the same result as running it once. Without it, every retry is a decision and every backfill is a risk.",
      "Write merge_partition(existing, incoming, key) returning the table state after loading incoming, where both are lists of dicts.",
      "Rows in incoming replace rows in existing with the same key, rows with a new key are added, and rows in existing that incoming does not mention are left alone — that last part is what makes it a merge rather than a replace.",
      "Return the result sorted by key. Running it twice with the same incoming must give the same answer as running it once.",
    ],
    starter: `def merge_partition(existing, incoming, key="id"):
    """Upsert incoming into existing on key, and return the new state."""
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

# The caller's list must not be mutated — a task that edits its input is a
# task that behaves differently on a retry.
before = [{"id": 1, "amount": 100}]
merge_partition(before, [{"id": 1, "amount": 999}])
assert before == [{"id": 1, "amount": 100}], "do not mutate the input"
`,
    hint: "A dict keyed by the key column, built from existing and then updated from incoming, gives you replace-or-insert in one step. Sort the values at the end, and build a new dict rather than editing the rows you were handed.",
  },
];
