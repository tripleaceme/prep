import type { Category, ConceptProblem, Difficulty } from "../types";

/**
 * Builds a concept question.
 *
 * Just the question — no answer, because the AI evaluates what the candidate
 * says rather than comparing it against prose written here. That is what lets
 * this library hold hundreds of them.
 *
 * The slug is derived from the title rather than typed, so two questions
 * cannot silently share one. `index.ts` asserts that every slug in the library
 * is unique, which is what makes deriving it safe.
 */
export function concept(
  category: Category,
  difficulty: Difficulty,
  title: string,
  /** The question, worded as an interviewer would actually say it. */
  prompt: string,
): ConceptProblem {
  return {
    kind: "concept",
    slug: slugify(title),
    title,
    category,
    difficulty,
    prompt: [prompt],
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}
