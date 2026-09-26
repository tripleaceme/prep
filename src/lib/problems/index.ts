import { ARCHITECTURE_PROBLEMS } from "./architecture";
import { DBT_PROBLEMS } from "./dbt";
import { PYTHON_PROBLEMS } from "./python";
import { SQL_PROBLEMS } from "./sql";
import type { Category, Problem } from "./types";

export * from "./types";
export { compileDbt } from "./dbt";

/** Ordered so the list reads from writing SQL through to explaining a design. */
export const PROBLEMS: Problem[] = [
  ...(SQL_PROBLEMS as Problem[]),
  ...DBT_PROBLEMS,
  ...PYTHON_PROBLEMS,
  ...ARCHITECTURE_PROBLEMS,
];

export function getProblem(slug: string): Problem | undefined {
  return PROBLEMS.find((p) => p.slug === slug);
}

export function problemsByCategory(category: Category): Problem[] {
  return PROBLEMS.filter((p) => p.category === category);
}
