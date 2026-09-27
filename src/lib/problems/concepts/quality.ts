import { concept } from "./build";

/**
 * Data quality, observability and governance concept questions.
 *
 * Quality and testing is a named round in its own right for analytics
 * engineering, and the research found it rising for data engineering too. The
 * governance questions cluster at senior level — one guide puts it plainly:
 * governance never appears in junior interviews and is expected by staff.
 */
export const QUALITY_CONCEPTS = [
  // ---- Fundamentals ------------------------------------------------------
  concept("data-quality", "easy", "What does data quality actually mean?",
    "What does data quality mean in practice? Give me the dimensions you'd measure rather than a definition."),
  concept("data-quality", "easy", "The minimum set of checks",
    "What is the minimum set of checks you'd put on every table you own, without exception?"),
  concept("data-quality", "medium", "Row-level checks and aggregate checks",
    "What's the difference between a row-level check and an aggregate check, and when does each catch something the other can't?"),
  concept("data-quality", "medium", "Validation versus reconciliation",
    "What's the difference between data validation and data reconciliation? Which one catches a partial load?"),
  concept("data-quality", "medium", "What is data freshness?",
    "What is data freshness, how do you measure it, and why is it the check people add last and need first?",
    "freshness"),
  concept("data-quality", "medium", "Common failure modes",
    "What are the data quality failures you see most often in practice? Rank them by how long they typically go unnoticed."),

  // ---- Designing checks ---------------------------------------------------
  concept("data-quality", "hard", "Checks for an incremental pipeline",
    "How do you design quality checks for an incremental pipeline, where you only ever see a slice of the data?"),
  concept("data-quality", "hard", "Late data and quality checks",
    "How does late-arriving data interact with your quality checks? What breaks if you don't account for it?"),
  concept("data-quality", "hard", "Detecting schema drift",
    "How do you detect schema drift and breaking changes before they reach a report?"),
  concept("data-quality", "hard", "Anomaly detection on a metric",
    "When is anomaly detection on a metric worth having, and when is a fixed threshold better?"),
  concept("data-quality", "hard", "Thresholds that survive growth",
    "You set an alert threshold that fired constantly within a month. What did you do wrong, and what would you do instead?"),
  concept("data-quality", "hard", "Quarantining without blocking",
    "How do you quarantine bad rows without blocking the whole pipeline? What has to be true for that to be safe?",
    "dead-letter"),
  concept("data-quality", "medium", "Avoiding noisy alerts",
    "How do you stop data quality alerts becoming noise that everyone ignores?"),
  concept("data-quality", "medium", "Testing a transformation",
    "How do you test a data transformation? What can a test on the output never tell you?"),

  // ---- Observability ------------------------------------------------------
  concept("data-quality", "medium", "What is data observability?",
    "What is data observability, and how is it different from application observability?"),
  concept("data-quality", "medium", "The signals worth watching",
    "What are the key signals you'd monitor for a data platform? Name them and say what each one catches.",
    "freshness"),
  concept("data-quality", "hard", "Defining an end-to-end SLA",
    "How do you define and measure an end-to-end SLA for a dataset? Who agrees to it?"),
  concept("data-quality", "hard", "Detecting a silent failure",
    "What is a silent failure in a data pipeline, and how would you detect one?",
    "freshness"),
  concept("data-quality", "medium", "What to log per run",
    "What should every pipeline run log? Write it for the person debugging it six weeks later."),
  concept("data-quality", "hard", "Lineage during an incident",
    "How does lineage help during an incident? Be specific about the question it answers quickly."),
  concept("data-quality", "hard", "A metric on a dashboard is wrong",
    "Someone in finance says the revenue number on the dashboard is off by eleven percent from the close. Walk me through the next hour."),
  concept("data-quality", "hard", "Bad data went out to clients",
    "A source has been reporting incorrect data for two weeks, and it's already gone out to clients and into internal analyses. How do you find the root cause, and how do you communicate it?"),
  concept("data-quality", "hard", "Common incident patterns",
    "What are the incident patterns you see repeatedly on data platforms, and which one is most preventable?"),

  // ---- Governance ---------------------------------------------------------
  concept("data-quality", "medium", "What is data governance?",
    "What is data governance, and how is it different from data security?"),
  concept("data-quality", "medium", "Owners, stewards and custodians",
    "What are the common roles in data governance, and who actually decides what a metric means?"),
  concept("data-quality", "medium", "What belongs in a data catalog?",
    "What is a data catalog, and what has to be in it for anyone to use it twice?"),
  concept("data-quality", "medium", "Business glossary or technical metadata?",
    "What's the difference between a business glossary and technical metadata, and why do you need both?"),
  concept("data-quality", "hard", "RBAC or ABAC?",
    "What's the difference between role-based and attribute-based access control, and when does RBAC stop scaling?",
    "masking"),
  concept("data-quality", "hard", "Row and column level security",
    "What are row-level and column-level security, and how would you implement them without creating fifty views?",
    "masking"),
  concept("data-quality", "hard", "PII in an analytics platform",
    "How do you handle PII in an analytics platform so that analysts can still do their work?",
    "masking"),
  concept("data-quality", "hard", "Masking and tokenisation",
    "What's the difference between masking and tokenisation, and why is hashing an identifier not anonymisation?",
    "masking"),
  concept("data-quality", "hard", "Right to be forgotten in a warehouse",
    "A user exercises their right to erasure. What does honouring that actually require across a warehouse and a lake?"),
  concept("data-quality", "hard", "Auditability of data access",
    "How do you implement auditability for data access, and what makes an audit log useful rather than just large?"),
  concept("data-quality", "hard", "Retention policies",
    "What is a data retention policy, and how do you enforce one when data has been copied into six downstream tables?"),
  concept("data-quality", "hard", "Quality standards across fifteen teams",
    "How do you enforce data quality standards across fifteen teams producing data, when you don't manage any of them?"),
];
