/**
 * Architecture and design questions.
 *
 * These are not executable, and pretending otherwise would be worse than
 * admitting it. There is no single correct answer to "warehouse or lakehouse"
 * — the interviewer is listening for whether you reason about trade-offs, and
 * a checker that marks that right or wrong would be teaching the wrong thing.
 *
 * So: you write your answer first, then reveal what a strong one covers and
 * mark yourself honestly. Grading these with the AI was the alternative, and
 * it was rejected because it would put an API key between the user and the one
 * section of Prep that is meant to work without one.
 */

import type { ArchitectureProblem } from "./types";

export const ARCHITECTURE_PROBLEMS: ArchitectureProblem[] = [
  {
    kind: "architecture",
    slug: "arch-warehouse-vs-lakehouse",
    title: "Warehouse or lakehouse?",
    category: "architecture",
    difficulty: "medium",
    prompt: [
      "A 40-person company runs analytics on Postgres read replicas and it has stopped coping. You have one data engineer — you — and a budget that gets noticed.",
      "Would you put them on a warehouse or a lakehouse, and why?",
    ],
    keyPoints: [
      "Names the constraints before the technology: one engineer, visible budget, current pain is query load rather than data volume.",
      "A lakehouse buys cheap storage and open formats, and costs you operational complexity a single engineer has to carry alone.",
      "A warehouse buys managed operations and fast time-to-value, and costs you compute pricing that grows with use and some lock-in.",
      "At this size the binding constraint is engineering time, not storage cost — which points at the warehouse.",
      "Says what would change the answer: large unstructured or semi-structured volumes, ML workloads on raw files, or a hard data-residency requirement.",
    ],
    modelAnswer: [
      "I'd start with what's actually hurting. Postgres replicas failing under analytics load is a concurrency and workload-isolation problem, not necessarily a volume problem — so I'd check the data size before reaching for anything.",
      "With one engineer and a budget that gets noticed, I'd take a warehouse. A lakehouse's advantages are real — cheap object storage, open table formats, no lock-in — but they're paid for in operational work: catalogues, compaction, file layout, permissions. That's a reasonable trade with a platform team and a bad one with a single engineer, because every hour spent on it is an hour not spent on the models anyone asked for.",
      "I'd revisit that if the shape of the data changed: heavy semi-structured or unstructured volume, ML training reading raw files, or a residency requirement that rules out the managed options. At 40 people the constraint is my time, and the warehouse is the one that spends less of it.",
    ],
    hint: "The strongest version of this answer names the constraint that decides it, rather than listing features of both.",
  },
  {
    kind: "architecture",
    slug: "arch-late-arriving-data",
    title: "Design for late-arriving data",
    category: "architecture",
    difficulty: "hard",
    prompt: [
      "Events from a mobile app can arrive days after they happened — a phone goes offline, then syncs.",
      "Finance reports revenue daily from these events and needs yesterday's number to stop changing at some point.",
      "How would you design the pipeline?",
    ],
    keyPoints: [
      "Separates event time from processing time, and watermarks on the load time rather than the event date.",
      "Uses a lookback window — reprocess the last N days rather than only the newest partition.",
      "Makes the load idempotent, so reprocessing a day produces the same answer rather than doubling it.",
      "Names the trade-off explicitly: a longer lookback catches more stragglers and costs more compute every run.",
      "Gives finance a rule they can work with — the number is provisional for N days, then frozen — rather than letting it drift silently.",
    ],
    modelAnswer: [
      "The first thing is to stop conflating event time and processing time. I'd land both: the timestamp the event claims, and the timestamp we received it. The incremental watermark runs on the received time, because watermarking on the event date is what silently drops a straggler forever — its date is already behind the high-water mark by the time it lands.",
      "Then a lookback window. Each run reprocesses the last N days rather than just the newest partition, with an idempotent merge on the event key so reprocessing a day rewrites it instead of doubling it. N comes from the data: I'd look at the distribution of received-minus-event and pick a window covering, say, 99% of it.",
      "The part that matters to finance isn't technical. A number that keeps moving with no rule is worse than one that's briefly wrong, so I'd tell them explicitly: the last N days are provisional and anything older is frozen. Then reconcile against a monthly close to catch what falls outside the window.",
    ],
    hint: "Two clocks, a lookback, an idempotent merge — and a promise finance can plan around.",
  },
  {
    kind: "architecture",
    slug: "arch-nobody-trusts-the-data",
    title: "Nobody trusts the dashboard",
    category: "architecture",
    difficulty: "medium",
    prompt: [
      "Two teams quote different revenue numbers in the same meeting. Both are reading dashboards you built.",
      "Where do you start?",
    ],
    keyPoints: [
      "Diagnoses before fixing: the numbers may both be correct and measuring different things.",
      "Looks for the definitional split — which orders count, which currency, which date, gross or net.",
      "Names a single owned definition and one model that produces it, rather than patching the two dashboards.",
      "Adds tests that would have caught the divergence, then a contract on the upstream producer.",
      "Treats it as a governance problem as much as a data one: someone has to own the definition.",
    ],
    modelAnswer: [
      "I'd resist fixing anything until I knew whether either was wrong. Two different revenue numbers are usually two different definitions, not a bug — cancelled orders included or not, order date against ship date, gross against net of refunds, currency converted at which rate.",
      "So I'd trace both back to the models behind them and find the line where they diverge. That usually takes an afternoon and it settles the argument, because you can show both teams exactly which decision they each made.",
      "The fix isn't patching the two dashboards to agree. It's picking one definition, giving it a named owner, building a single model that produces it, and pointing both dashboards at that. Then tests that would have caught the divergence — a reconciliation between the mart and the source, and a freshness check — and a contract with whoever produces the upstream data so the shape can't change without warning.",
      "The lasting problem here is governance rather than SQL. Until one person owns what revenue means, two correct pipelines will keep producing two numbers.",
    ],
  },
  {
    kind: "architecture",
    slug: "arch-batch-vs-streaming",
    title: "Do they actually need streaming?",
    category: "architecture",
    difficulty: "medium",
    prompt: [
      "A stakeholder asks for real-time dashboards. Your current pipeline runs hourly.",
      "How do you handle the request?",
    ],
    keyPoints: [
      "Asks what decision the freshness enables — real-time is a means, not a requirement.",
      "Distinguishes genuine streaming needs (fraud, ops alerting, live pricing) from wanting a fresher number.",
      "Offers the cheaper intermediate: a more frequent batch, or micro-batches.",
      "Names the real cost of streaming — operational complexity, on-call, harder correctness and backfills.",
      "Doesn't refuse outright; proposes a way to find out what's actually needed.",
    ],
    modelAnswer: [
      "I'd ask what decision gets made on the fresher number, and how quickly. \"Real-time\" is usually a proxy for \"the number I'm looking at is stale and I don't trust it\" — and the answer to that is often an hourly run that's visibly on time, not a streaming rewrite.",
      "There are genuine cases: fraud scoring, operational alerting, anything a person or a system acts on within minutes. If that's what this is, streaming is right and I'd scope it as its own pipeline rather than converting everything.",
      "If it isn't, I'd offer the cheap intermediate — running every fifteen minutes, say — and be straight about what streaming actually costs: it's on-call, it's harder to reason about correctness, and backfilling a bug is a genuinely different problem than re-running a batch job.",
      "Usually the fifteen-minute version ends the conversation. When it doesn't, that's the signal the need was real.",
    ],
  },
];
