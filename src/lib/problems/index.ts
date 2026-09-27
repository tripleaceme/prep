import { ARCHITECTURE_PROBLEMS } from "./architecture";
import { CONCEPT_PROBLEMS } from "./concepts";
import { CODE_REVIEW_DBT, CODE_REVIEW_DESIGN, CODE_REVIEW_SQL } from "./code-review";
import { DBT_PROBLEMS } from "./dbt";
import { DIMENSIONAL_PROBLEMS } from "./dimensional";
import { ORCHESTRATION_PROBLEMS } from "./orchestration";
import { PERFORMANCE_PROBLEMS } from "./performance";
import { PIPELINE_DESIGN_PROBLEMS } from "./pipeline-design";
import { PYTHON_PROBLEMS } from "./python";
import { QUALITY_PROBLEMS } from "./quality";
import { SQL_PROBLEMS } from "./sql";
import { getGroup, type Category, type Group, type Problem } from "./types";

export * from "./types";
export { compileDbt } from "./dbt";

/** Ordered so the list reads from writing SQL through to explaining a design. */
export const PROBLEMS: Problem[] = [
  ...CONCEPT_PROBLEMS,
  ...(SQL_PROBLEMS as Problem[]),
  ...DBT_PROBLEMS,
  ...(CODE_REVIEW_SQL as Problem[]),
  ...CODE_REVIEW_DBT,
  ...CODE_REVIEW_DESIGN,
  ...DIMENSIONAL_PROBLEMS,
  ...PYTHON_PROBLEMS,
  ...(QUALITY_PROBLEMS as Problem[]),
  ...ORCHESTRATION_PROBLEMS,
  ...PERFORMANCE_PROBLEMS,
  ...PIPELINE_DESIGN_PROBLEMS,
  ...ARCHITECTURE_PROBLEMS,
];

export function getProblem(slug: string): Problem | undefined {
  return PROBLEMS.find((p) => p.slug === slug);
}

export function problemsByCategory(category: Category): Problem[] {
  return PROBLEMS.filter((p) => p.category === category);
}

export function problemsByGroup(group: Group): Problem[] {
  const categories = getGroup(group)?.categories ?? [];
  return PROBLEMS.filter((p) => categories.includes(p.category));
}

/**
 * Concept question slugs are derived from their titles rather than typed, so a
 * duplicate title silently shadows a question: the router resolves one, and
 * the other is unreachable from its own list entry.
 *
 * This runs in production too, not only in development. It was originally
 * guarded by a NODE_ENV check and so never ran during `next build` — a real
 * clash ("Testing a transformation", used for both a data quality question
 * and a Python one) shipped and was only found when a script happened to
 * import the library outside Next. One pass over a few hundred slugs at
 * module load is not worth the hole.
 */
{
  const seen = new Set<string>();
  const clashes = PROBLEMS.map((p) => p.slug).filter((slug) => {
    if (seen.has(slug)) return true;
    seen.add(slug);
    return false;
  });
  if (clashes.length) {
    throw new Error(`Duplicate problem slugs: ${[...new Set(clashes)].join(", ")}`);
  }
}
