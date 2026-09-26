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
  {
    kind: "architecture",
    slug: "arch-case-dashboard-disagreement",
    title: "Case study: two dashboards, two revenue numbers",
    category: "architecture",
    difficulty: "medium",
    prompt: [
      "Finance and Sales each have a revenue dashboard. The numbers have never matched, and the gap moves. Both teams have stopped trusting the data platform, and the CFO has asked you to fix it this quarter.",
      "You find that each dashboard has its own SQL, written at different times, against the same source tables.",
      "How would you resolve it, and how would you stop it happening again?",
    ],
    keyPoints: [
      "Diagnoses before rebuilding: reconcile the two queries line by line to find where the definitions diverge, rather than declaring one correct.",
      "Names the likely culprits — different date grain, different status filters, refunds and cancellations handled differently, currency or tax treatment.",
      "Fixes it at the model, not in the BI tool: one governed revenue model that both dashboards read from.",
      "Treats the definition as the deliverable, not the query — the business has to agree what revenue means before anything is written.",
      "Prevents recurrence: BI tools point at marts rather than raw tables, definitions live in one place with tests, and someone owns the metric.",
      "Handles the politics: publishing a number that makes one team's past reporting wrong needs a migration story, not just a merge.",
    ],
    modelAnswer: [
      "First I'd stop treating it as a bug. Two numbers differing usually means two definitions, and until I know which one the business actually wants, rebuilding either is guesswork.",
      "So I'd reconcile the two queries against one sample month and find exactly where they part company. In my experience it's a small list: one counts at order date and the other at payment date, one excludes refunds and the other nets them later, one filters cancelled orders and the other doesn't. Writing down the difference in rows and money is what turns an argument into a decision.",
      "Then I'd get Finance and Sales in the same conversation and make them agree on the definition — including the awkward parts, like whether a refund reduces the month it was issued in or the month of the original sale. That agreement is the actual deliverable; the SQL is the easy part.",
      "I'd build one revenue model in the warehouse, with tests on the grain and on the joins, and point both dashboards at it. No revenue logic in the BI layer. And I'd give it an owner, because a definition with no owner drifts again within a year.",
      "Last thing: I'd expect one team's historical numbers to move. I'd publish the old and new side by side for a period and explain the delta, rather than silently changing a number someone has already reported to a board.",
    ],
    hint: "Strong answers spend most of their time on the definition and the people, not on the modelling.",
  },
  {
    kind: "architecture",
    slug: "arch-case-pipeline-on-fire",
    title: "Case study: the nightly load has failed three nights running",
    category: "architecture",
    difficulty: "medium",
    prompt: [
      "You are on call. The nightly load has failed three nights in a row, each time with a different error. The team's response so far has been to rerun it in the morning, which works about half the time.",
      "Executives saw stale dashboards this morning and are asking questions.",
      "Walk me through how you handle the next 48 hours, and what you change afterwards.",
    ],
    keyPoints: [
      "Separates stabilising from fixing: the immediate job is a correct dashboard today, the real job is why it keeps breaking.",
      "Communicates outward early — a known-stale banner beats an executive discovering it themselves.",
      "Treats 'a different error each time' as a signal, likely a resource, ordering or upstream-contract problem rather than three separate bugs.",
      "Makes reruns safe: idempotent loads, so the morning rerun is not itself a risk.",
      "Adds observability that would have caught it — freshness checks and row-count anomalies, alerting before the dashboard is wrong, not after.",
      "Names what they would not do: rewriting the pipeline mid-incident.",
    ],
    modelAnswer: [
      "In the first hours I'm not trying to fix the root cause, I'm trying to get today's number right and tell people where they stand. I'd rerun to get the data current, and put a freshness banner on the dashboards so nobody reads a stale chart without knowing it. Executives being surprised is worse than executives being told.",
      "Then I'd look at the three failures together rather than separately. Three different errors on three nights usually isn't three bugs — it's one underlying condition surfacing differently. Common ones: the job is now colliding with something else for warehouse resources, an upstream table started landing later than the schedule assumes, or data volume crossed a threshold and things are timing out at whichever step happens to be slowest that night.",
      "While I'm diagnosing, I'd make the rerun safe. If reruns only work half the time, that's often partial writes, and the fix is making the load idempotent — write to a staging location and swap, or delete-and-insert the partition — so a rerun is boring instead of risky.",
      "Afterwards, the change I care about is detection. This pipeline told us it was broken by an executive noticing. I'd add a freshness check and a row-count anomaly check that page before business hours, and I'd make the failure notification say which step and which table, so the next person on call starts where I finished rather than where I started.",
      "What I wouldn't do is rewrite it during the incident. Mid-incident rewrites are how a three-day problem becomes a three-week one.",
    ],
    hint: "Interviewers are listening for whether you can hold 'stop the bleeding' and 'fix the cause' as separate activities.",
  },
  {
    kind: "architecture",
    slug: "arch-case-pii-analytics",
    title: "Case study: analysts need the data, compliance says no",
    category: "architecture",
    difficulty: "hard",
    prompt: [
      "A health-adjacent product holds customer names, phone numbers, addresses and appointment notes. Analysts want to build retention models; compliance will not let personal data sit in the analytics warehouse.",
      "Both positions are reasonable. Design something that lets the analysis happen.",
    ],
    keyPoints: [
      "Distinguishes the fields that carry analytical value from the fields that identify a person — most analysis needs the behaviour, not the name.",
      "Proposes concrete techniques rather than the word 'anonymise': tokenisation or hashing with a salt held outside the warehouse, generalising addresses to a region, dropping free text or holding it separately.",
      "Notes that hashing alone is not anonymisation — a hashed phone number is still a stable identifier, and rare combinations re-identify people.",
      "Uses access control as well as transformation: restricted schemas, row and column level security, and a short-lived path for the rare case that genuinely needs the raw value.",
      "Builds in retention and deletion, because a right-to-erasure request has to reach the warehouse too, including its backups and derived tables.",
      "Involves compliance in the design rather than presenting them with a finished system.",
    ],
    modelAnswer: [
      "I'd start by asking what the retention model actually needs, because the answer is usually 'behaviour over time', not 'who this person is'. Appointment frequency, gaps, cancellations, tenure, channel. Almost none of that requires a name or a phone number.",
      "So the design is a pseudonymised layer. Each customer gets a stable token in the warehouse, generated from a mapping table that lives in the operational system and is not replicated into analytics. Addresses become a region or a postcode prefix. Free-text notes don't come across at all in the first version — they're the highest risk and the lowest immediate value, and I'd rather ship without them than stall the whole thing arguing about them.",
      "I'd be honest with compliance that this is pseudonymisation, not anonymisation. A stable token is still a personal identifier under most regimes, and a rare combination of attributes can re-identify someone even without one. That honesty matters, because overclaiming here is how teams lose the trust that got them the data.",
      "On top of that, access control: personal-adjacent columns in a restricted schema, granted by role rather than by request, with a short-lived break-glass path for the rare genuine need and a log of who used it.",
      "And deletion has to work end to end. A right-to-erasure request that clears the production database but leaves the token and its history in the warehouse hasn't been honoured. That means knowing which derived tables carry the token, and having a way to purge it from them.",
      "Practically, I'd bring compliance in while designing rather than after. A design they helped shape gets approved; one they're handed gets refused.",
    ],
    hint: "The weak version of this answer says 'we anonymise it'. The strong version names what is left identifiable and how access and deletion are handled.",
  },
  {
    kind: "architecture",
    slug: "arch-case-first-hire",
    title: "Case study: you are the first data hire",
    category: "architecture",
    difficulty: "medium",
    prompt: [
      "You've joined a 60-person company as its first data person. There are no pipelines. Reporting is a set of spreadsheets that three people maintain by hand, and everyone has a different idea of what you should build first.",
      "What do you do in your first 90 days?",
    ],
    keyPoints: [
      "Starts with discovery — which decisions are being made badly for lack of data — rather than with tool selection.",
      "Ships something visibly useful early, to buy the credibility that the slower foundational work requires.",
      "Chooses boring, managed tools, because a solo engineer cannot operate a bespoke stack.",
      "Replaces one spreadsheet properly rather than replacing all three badly.",
      "Builds the foundation underneath the first deliverable — ingestion, a warehouse, version-controlled transformations — instead of as a separate project nobody can see.",
      "Plans for handover from the start: documentation and naming that a second hire can pick up.",
      "Explicitly names what they are not doing yet — no ML, no real-time, no data catalogue.",
    ],
    modelAnswer: [
      "The first two weeks I'd mostly be listening. I'd ask each function what decision they're making without good numbers, and separately I'd sit with whoever maintains the spreadsheets, because the manual work encodes business logic nobody has written down anywhere else.",
      "Out of that I'd pick one thing to ship in month one. Not the most important thing necessarily — the most visible thing I can do properly. A first data hire's real constraint is credibility, and a working dashboard people open daily buys more room than a roadmap does.",
      "I'd build it on the foundation rather than beside it. Managed ingestion into a warehouse, transformations in version control with tests, a BI tool on top. Boring and managed, because I'm on my own and every bespoke component is something I personally get paged for.",
      "Months two and three, I'd replace one of the three spreadsheets end to end — including the awkward logic — and get the person who maintained it to validate the numbers against theirs. Their sign-off is what makes the rest of the company believe it.",
      "Throughout, I'd write things down as though I'm leaving, because the goal of the first 90 days is to make the second hire possible. Naming conventions, a readme per model, documented definitions.",
      "And I'd say out loud what I'm not doing: no machine learning, no streaming, no catalogue tooling. At 60 people those are distractions, and being explicit about deferring them stops them arriving as surprise expectations.",
    ],
    hint: "This is really a prioritisation and stakeholder question wearing an architecture costume. Answers that jump straight to a tool list score poorly.",
  },
];
