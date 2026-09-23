/**
 * Mock Interview tracks.
 *
 * Where the reference product splits practice by software-engineering topics
 * (frontend, system design, DSA), Prep splits it by the domains an analytics
 * or data engineer is actually interviewed on. This is the whole reason the
 * product exists, so these definitions drive both the UI and the prompt sent
 * to the interviewer model.
 */

export type TrackSlug =
  | "data-modelling"
  | "orchestration"
  | "data-architecture"
  | "data-pipelines"
  | "data-quality"
  | "data-catalog";

export interface Track {
  slug: TrackSlug;
  name: string;
  blurb: string;
  minutes: number;
  questions: number;
  topics: string[];
  /** Steers the interviewer model towards what this domain really tests. */
  examines: string;
}

export const TRACKS: Track[] = [
  {
    slug: "data-modelling",
    name: "Data Modelling",
    blurb:
      "Dimensional modelling under questioning — grain, slowly changing dimensions, and when a star schema is the wrong answer.",
    minutes: 40,
    questions: 6,
    topics: [
      "Star & Snowflake",
      "Fact Grain",
      "SCD Types",
      "Normalisation",
      "Surrogate Keys",
    ],
    examines:
      "whether the candidate can choose a grain and defend it, model slowly changing dimensions correctly, and explain the trade-offs between normalised and dimensional designs rather than reciting definitions",
  },
  {
    slug: "orchestration",
    name: "Orchestration",
    blurb:
      "Scheduling, dependencies and failure. Airflow and Dagster concepts, retries, backfills and why idempotency keeps coming up.",
    minutes: 40,
    questions: 6,
    topics: [
      "DAG Design",
      "Scheduling",
      "Retries & SLAs",
      "Backfills",
      "Idempotency",
    ],
    examines:
      "how the candidate reasons about task dependencies, what they do when a nightly job fails at 3am, whether they understand idempotent reruns and backfill strategy, and how they handle late or out-of-order data",
  },
  {
    slug: "data-architecture",
    name: "Data Architecture",
    blurb:
      "The shape of the whole stack. Warehouse versus lakehouse, batch versus streaming, storage formats and what each choice costs.",
    minutes: 45,
    questions: 6,
    topics: [
      "Warehouse vs Lakehouse",
      "Medallion",
      "Batch vs Streaming",
      "File Formats",
      "Cost",
    ],
    examines:
      "whether the candidate can justify an architecture against real constraints — budget, team size, latency requirements — instead of naming tools, and whether they understand what Parquet, Iceberg and columnar storage actually buy them",
  },
  {
    slug: "data-pipelines",
    name: "Data Pipelines",
    blurb:
      "Moving data without breaking it. ELT versus ETL, incremental loads, change data capture and late-arriving records.",
    minutes: 40,
    questions: 6,
    topics: [
      "ELT vs ETL",
      "Incremental Loads",
      "CDC",
      "Late-Arriving Data",
      "Replays",
    ],
    examines:
      "how the candidate designs an incremental load, whether they can explain change data capture and its failure modes, and what they do when yesterday's data arrives today",
  },
  {
    slug: "data-quality",
    name: "Data Quality",
    blurb:
      "Tests, contracts and trust. What to assert, where to assert it, and how you find out something broke before the business does.",
    minutes: 35,
    questions: 6,
    topics: [
      "Testing Strategy",
      "Data Contracts",
      "Freshness",
      "Anomaly Detection",
      "Observability",
    ],
    examines:
      "whether the candidate can design a testing strategy rather than list test types, how they think about contracts between producers and consumers, and how they'd detect a silent failure that passes every schema check",
  },
  {
    slug: "data-catalog",
    name: "Data Catalog & Governance",
    blurb:
      "Discovery, lineage and ownership. Who owns a table, who can see it, and how anyone finds it in the first place.",
    minutes: 35,
    questions: 6,
    topics: [
      "Metadata",
      "Lineage",
      "Ownership",
      "Access Control",
      "Discovery",
    ],
    examines:
      "whether the candidate treats governance as an enabler rather than paperwork, how they'd make a 4,000-table warehouse navigable, and how they reason about column-level lineage and access policy",
  },
];

export function getTrack(slug: string): Track | undefined {
  return TRACKS.find((t) => t.slug === slug);
}

/* ------------------------------------------------------------------------ */
/* Onboarding options — mirrors the `profiles` check constraints in schema.sql */
/* ------------------------------------------------------------------------ */

export const CAREER_STAGES = [
  { value: "student", label: "Student or recent graduate", hint: "Still studying or just finished" },
  { value: "early", label: "Early career", hint: "0–2 years of work experience" },
  { value: "mid", label: "Mid-level", hint: "2–5 years of work experience" },
  { value: "senior", label: "Senior / experienced", hint: "5+ years of work experience" },
  { value: "switching", label: "Changing careers", hint: "Switching fields or returning to work" },
] as const;

export const EMPLOYER_TYPES = [
  { value: "big", label: "Big / established companies", hint: "Well-known national or global employers" },
  { value: "startup", label: "Startups & small businesses", hint: "Fast-moving, early-stage teams" },
  { value: "midsize", label: "Mid-size companies", hint: "Growing, established organisations" },
  { value: "public", label: "Government, NGO & public", hint: "Public sector, agencies, non-profits" },
  { value: "any", label: "Open to anything", hint: "I'm exploring all opportunities" },
] as const;

export const GOALS = [
  { value: "first_job", label: "Land my first data job", hint: "Break into the field for the first time" },
  { value: "switch_job", label: "Switch to a new job", hint: "Move to a better role or company" },
  { value: "grow", label: "Grow in my current field", hint: "Sharpen my skills and level up" },
  { value: "upcoming_interview", label: "Prepare for interviews", hint: "I have interviews coming up soon" },
] as const;

export const FIELDS = [
  { value: "analytics_engineering", label: "Analytics Engineering", hint: "dbt, modelling, transformation" },
  { value: "data_engineering", label: "Data Engineering", hint: "Pipelines, orchestration, infrastructure" },
  { value: "analytics_bi", label: "Analytics & BI", hint: "Reporting, dashboards, business analysis" },
  { value: "data_science", label: "Data Science", hint: "Statistics, modelling, experimentation" },
  { value: "other", label: "Other / not sure yet", hint: "Something else in data" },
] as const;
