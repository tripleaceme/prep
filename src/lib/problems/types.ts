/**
 * Coding problems.
 *
 * Four kinds, because "can you do this job" is four different questions for an
 * analytics or data engineer, and only one of them is SQL:
 *
 *   sql           — shape a result set. Runs on DuckDB in the browser.
 *   dbt           — write a model. The ref() calls are resolved against
 *                   fixture tables and the model is run, so it is genuinely
 *                   executed rather than eyeballed.
 *   python        — write the transform. Runs on Pyodide in the browser,
 *                   against assertions you don't see until you run them.
 *   architecture  — explain a decision. Not executable, and pretending
 *                   otherwise would be worse than admitting it: you write an
 *                   answer, then compare it against the points a good one
 *                   makes.
 *
 * Nothing here needs an AI key or a server. That is the whole point of this
 * section — it is the part of Prep that works when you have neither.
 */

export type Difficulty = "easy" | "medium" | "hard";

export type Category =
  | "sql-fundamentals"
  | "joins-aggregation"
  | "window-functions"
  | "pipeline-debugging"
  | "dbt-modelling"
  | "python-pipelines"
  | "data-quality"
  | "orchestration"
  | "architecture";

/**
 * Every problem is a contract with four parts, because a question that leaves
 * any of them out reads as vague however clearly the task itself is written:
 *
 *   1. What the data is      — `setup`, plus `tableNotes` saying what one row
 *                              of each table means.
 *   2. What to compute       — `prompt`, opening with the situation and
 *                              closing with an imperative task sentence.
 *   3. What the output is    — exact column names, sort order and rounding,
 *                              stated in `prompt`; the rows themselves are
 *                              computed from `solution` and shown.
 *   4. Why that output       — `explanation`, justifying the rows, including
 *                              at least one that had to be left out.
 *
 * `notes` carries anything a reader could take two ways, defined operationally
 * rather than left to inference. `gotcha` names the wrong answer most people
 * reach for, which is the difference between a problem that teaches and one
 * that merely marks.
 */
interface BaseProblem {
  slug: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  /**
   * The situation, then the task, then what to output. Plain prose;
   * `backticks` become inline code.
   */
  prompt: string[];
  /**
   * Definitions and assumptions. One sentence each. Two jobs: define any
   * business term that could be read two ways, and defuse traps the problem
   * is not trying to set.
   */
  notes?: string[];
  /**
   * What one row of each fixture table means, keyed by table name, with its
   * key constraints. Shown against the table rather than buried in the prose.
   */
  tableNotes?: Record<string, string>;
  /**
   * Why the expected output is what it is. Should justify at least one row
   * that is absent — an explanation that only narrates the rows present does
   * not tell you where the edge is.
   */
  explanation?: string;
  /** The single most common wrong answer, and why it is wrong. */
  gotcha?: string;
  /**
   * A worked example, for problems with no fixture tables to show.
   *
   * SQL and dbt problems compute theirs by running `solution`, so they do not
   * need this. Python problems have nothing to run against until the
   * candidate writes it, which is exactly why leaving the example out made
   * them unanswerable: you could not see the shape of the input.
   */
  example?: { input: string; output: string };
  hint?: string;
}

export interface SqlProblem extends BaseProblem {
  kind: "sql";
  /** Builds the fixture tables. Runs before every attempt. */
  setup: string;
  starter: string;
  /** Produces the expected result set. */
  solution: string;
  orderMatters: boolean;
}

export interface DbtProblem extends BaseProblem {
  kind: "dbt";
  setup: string;
  /** Model names the problem may `ref()`, mapped to their fixture table. */
  refs: Record<string, string>;
  starter: string;
  solution: string;
  orderMatters: boolean;
}

export interface PythonProblem extends BaseProblem {
  kind: "python";
  starter: string;
  /**
   * Assertions run after the candidate's code. Hidden until they run, so the
   * problem is solved rather than pattern-matched against the checks.
   */
  tests: string;
}

export interface ArchitectureProblem extends BaseProblem {
  kind: "architecture";
  /** What a strong answer covers. Shown only after they've written theirs. */
  keyPoints: string[];
  modelAnswer: string[];
}

export type Problem =
  | SqlProblem
  | DbtProblem
  | PythonProblem
  | ArchitectureProblem;

export const CATEGORIES: {
  value: Category;
  label: string;
  blurb: string;
}[] = [
  {
    value: "sql-fundamentals",
    label: "SQL Fundamentals",
    blurb: "Filtering, shaping and grouping — the questions that open a screen.",
  },
  {
    value: "joins-aggregation",
    label: "Joins & Aggregation",
    blurb: "Getting the grain right when more than one table is involved.",
  },
  {
    value: "window-functions",
    label: "Window Functions",
    blurb: "Running totals, ranking, period-over-period and deduplication.",
  },
  {
    value: "dbt-modelling",
    label: "dbt Modelling",
    blurb:
      "Write the model. Your ref() calls resolve against real tables and the SQL actually runs.",
  },
  {
    value: "python-pipelines",
    label: "Python Pipelines",
    blurb:
      "The transform logic between extract and load, checked against tests you don't see first.",
  },
  {
    value: "pipeline-debugging",
    label: "Pipeline Debugging",
    blurb: "A pipeline is producing wrong numbers. Find out why, and fix it.",
  },
  {
    value: "data-quality",
    label: "Data Quality",
    blurb:
      "Write the check that catches it. Duplicates, nulls, broken keys, stale tables and numbers that drifted.",
  },
  {
    value: "orchestration",
    label: "Orchestration",
    blurb:
      "Dependencies, schedules, retries and backfills — the logic a scheduler runs on.",
  },
  {
    value: "architecture",
    label: "Architecture & Design",
    blurb:
      "The questions with no single right answer — where the interviewer is listening for trade-offs.",
  },
];

/* ------------------------------------------------------------------------ */
/* Groups                                                                    */
/*                                                                           */
/* Categories are fine-grained — window functions, dbt modelling — but a      */
/* flat list of every problem in every category is a wall to scroll rather    */
/* than something to choose from. Groups sit above them: you pick a subject,  */
/* then see its problems.                                                     */
/* ------------------------------------------------------------------------ */

export type Group =
  | "sql"
  | "modelling"
  | "pipelines"
  | "quality"
  | "orchestration"
  | "architecture";

export const GROUPS: {
  value: Group;
  label: string;
  blurb: string;
  categories: Category[];
}[] = [
  {
    value: "sql",
    label: "SQL",
    blurb:
      "From a first filter through to window functions — the questions a screen actually opens with.",
    categories: ["sql-fundamentals", "joins-aggregation", "window-functions"],
  },
  {
    value: "modelling",
    label: "Data Modelling",
    blurb:
      "dbt models, grain, slowly changing dimensions. Your ref() calls resolve and the SQL runs.",
    categories: ["dbt-modelling"],
  },
  {
    value: "pipelines",
    label: "Pipelines",
    blurb:
      "Transform logic, watermarks and idempotency in Python — plus pipelines producing wrong numbers.",
    categories: ["python-pipelines", "pipeline-debugging"],
  },
  {
    value: "quality",
    label: "Data Quality",
    blurb:
      "Write the check that catches it — duplicates, orphaned keys, stale tables, numbers that moved.",
    categories: ["data-quality"],
  },
  {
    value: "orchestration",
    label: "Orchestration",
    blurb:
      "Dependency order, schedule windows, retries and backfills. The logic underneath a DAG.",
    categories: ["orchestration"],
  },
  {
    value: "architecture",
    label: "Architecture & Design",
    blurb:
      "The questions with no single right answer, where the interviewer is listening for trade-offs.",
    categories: ["architecture"],
  },
];

export function getGroup(value: string) {
  return GROUPS.find((g) => g.value === value);
}

/** Which group a category belongs to. */
export function groupOfCategory(category: Category): Group {
  return GROUPS.find((g) => g.categories.includes(category))?.value ?? "sql";
}
