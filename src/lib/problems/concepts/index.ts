import { ARCHITECTURE_CONCEPTS } from "./architecture";
import { MODELLING_CONCEPTS } from "./modelling";
import { ORCHESTRATION_CONCEPTS, PIPELINE_CONCEPTS } from "./pipelines";
import { PERFORMANCE_CONCEPTS, PYTHON_CONCEPTS } from "./python-and-performance";
import { QUALITY_CONCEPTS } from "./quality";
import { METRICS_CONCEPTS, SQL_CONCEPTS } from "./sql-and-metrics";

/**
 * Every concept question in the library.
 *
 * These carry no model answer: the candidate says what they think and the AI
 * marks it. That is what makes the volume possible, and it is also what makes
 * them worth doing — self-marking against written prose measures recognition,
 * and recognition is not the thing that fails people in a room.
 */
export const CONCEPT_PROBLEMS = [
  ...SQL_CONCEPTS,
  ...METRICS_CONCEPTS,
  ...MODELLING_CONCEPTS,
  ...PYTHON_CONCEPTS,
  ...PIPELINE_CONCEPTS,
  ...QUALITY_CONCEPTS,
  ...ORCHESTRATION_CONCEPTS,
  ...PERFORMANCE_CONCEPTS,
  ...ARCHITECTURE_CONCEPTS,
];
