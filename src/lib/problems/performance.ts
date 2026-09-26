/**
 * Performance and optimisation problems.
 *
 * Written as diagnosis rather than as code, because that is how the round
 * actually runs: you are told a symptom — this query scans 500GB, this job
 * takes six hours, this warehouse bill doubled — and asked what you would
 * look at. Nobody is handed a keyboard and a slow cluster.
 *
 * Practitioners are blunt about the alternative. On whether algorithm puzzles
 * belong in a data engineering interview: "A query once written can be
 * analysed using logical and physical plans, in spark - spark job ui, in
 * snowflake - query profile. You DO NOT HAVE to know any dsa to understand a
 * query being slow." So these test reading the evidence, not recalling a
 * complexity class.
 *
 * Self-assessed, like the architecture questions: you answer first, then
 * compare against what a strong answer covers.
 */

import type { ArchitectureProblem } from "./types";

export const PERFORMANCE_PROBLEMS: ArchitectureProblem[] = [
  {
    kind: "architecture",
    slug: "perf-query-scans-everything",
    title: "This query scans 500GB to return 12 rows",
    category: "performance",
    difficulty: "medium",
    prompt: [
      "A daily dashboard query reads a 500GB events table and returns twelve rows. It costs more than the rest of the warehouse put together, and the finance team has started asking about it.",
      "The table is partitioned by event date. The query filters on a date, joins to a dimension, and aggregates.",
      "Walk me through how you would find out why it is reading everything, and what you would change.",
    ],
    keyPoints: [
      "Reads the query plan or profile first rather than guessing — names the specific tool (EXPLAIN, Snowflake's query profile, BigQuery's bytes-scanned estimate, the Spark UI) and what they would look for in it.",
      "Checks whether the partition filter is actually being used. A predicate wrapped in a function — DATE(event_timestamp) = '2024-05-01' — stops the engine eliminating partitions, and is the single most common cause of this symptom.",
      "Checks whether the filter is on a different column from the partition key, which looks correct in the SQL and prunes nothing.",
      "Looks at whether SELECT * is pulling every column out of a columnar store when the query needs four.",
      "Considers the join: a dimension broadcast small is cheap, a dimension joined before the filter is not, and the order matters.",
      "Proposes measuring after the change rather than declaring victory — the same profile, re-read.",
      "Mentions a pre-aggregated table or materialised view only after the scan problem is solved, not instead of solving it.",
    ],
    modelAnswer: [
      "I would not change anything until I had read the profile. The symptom — 500GB in, twelve rows out — says the engine is not eliminating data it could eliminate, and the profile tells me which step is doing the reading rather than leaving me to guess.",
      "My first suspicion is always partition pruning. If the table is partitioned on event date and the predicate wraps that column in a function, or casts it, most engines give up on pruning and read everything. The query looks right; it just scans the table. I have seen that exact bug survive review several times, because nothing about the SQL looks wrong.",
      "Second suspicion is that the filter is on a column adjacent to the partition key — filtering on created_at when the table is partitioned on event_date, say. Again it reads correctly and prunes nothing.",
      "Then the cheap wins: selecting only the columns needed, since a columnar store charges by column, and checking whether the dimension join happens before or after the filter.",
      "Once I had a hypothesis I would change one thing, re-read the profile, and compare bytes scanned. Changing three things at once and seeing an improvement teaches you nothing about which one mattered.",
      "Only after that would I consider a pre-aggregate. If a dashboard needs twelve rows a day, computing them once on a schedule is reasonable — but adding a second table on top of a query that scans wrongly means maintaining the bug rather than fixing it.",
    ],
    hint: "The strongest answers name the tool they would open first and what they expect to see in it, before naming any fix.",
  },
  {
    kind: "architecture",
    slug: "perf-warehouse-bill-doubled",
    title: "The warehouse bill doubled and nobody changed anything",
    category: "performance",
    difficulty: "medium",
    prompt: [
      "Your warehouse spend went from roughly £4,000 a month to £8,500, over about six weeks. No new pipelines shipped and nobody remembers changing a schedule.",
      "You have been asked to explain it by Friday.",
      "How do you work out where the money went?",
    ],
    keyPoints: [
      "Goes to the query history or usage tables first — every warehouse records per-query cost or credits, and that turns the question into arithmetic rather than opinion.",
      "Splits the increase by dimension before theorising: by warehouse or project, by user or service account, by hour of day, by query tag.",
      "Distinguishes the three shapes an increase takes — more queries, the same queries reading more data, or the same work on bigger compute — because each has a different cause and a different fix.",
      "Names plausible causes that involve nobody changing anything: data volume growing past a threshold, a BI tool's auto-refresh, a dashboard shared more widely, a warehouse that stopped auto-suspending, a dbt job whose incremental model silently started full-refreshing.",
      "Checks the boring explanation: a price change, or a trial credit expiring.",
      "Proposes cost attribution going forward — query tags or per-team warehouses — so the next investigation takes an hour rather than a week.",
      "Gives the answer as a breakdown rather than a single cause, because it usually is one.",
    ],
    modelAnswer: [
      "The data to answer this already exists. Every warehouse keeps a query history with cost or credits attached, so I would start by pulling spend per day for the last quarter and then splitting it — by warehouse, by user, by hour, by tag — until a line separates from the rest.",
      "Before that I would decide which of three shapes I am looking for, because they have different causes. Are we running more queries? Running the same queries over more data? Or running the same work on larger compute?",
      "'Nobody changed anything' is usually true and usually not the point. The things that raise a bill without a deploy are: data volume crossing a threshold so a query that used to prune now scans; a BI tool set to auto-refresh, with a dashboard that got popular; a warehouse whose auto-suspend was raised during an incident and never put back; and an incremental dbt model that started doing a full refresh because its schema changed.",
      "I would also check the unadventurous explanations — a list price change, or a trial credit running out — because they cost five minutes to rule out and I have been embarrassed by them before.",
      "I would expect to report a breakdown rather than a culprit: something like 60% one dashboard's refresh, 25% volume growth, 15% a warehouse left running. A single cause is the exception.",
      "Then the part that matters more than this month's bill: if attribution took me three days, it will take three days next time. Query tags per job, or separate warehouses per team, turn the next version of this question into a query.",
    ],
    hint: "There is a difference between answering where the money went and answering why nobody noticed. Both are being asked.",
  },
  {
    kind: "architecture",
    slug: "perf-spark-job-slow",
    title: "The Spark job takes six hours and two tasks do all the work",
    category: "performance",
    difficulty: "hard",
    prompt: [
      "A nightly Spark job that used to take forty minutes now takes six hours. Looking at the Spark UI, one stage has 200 tasks: 198 finish in under a minute, two run for hours.",
      "What is happening, and what would you do about it?",
    ],
    keyPoints: [
      "Names it as data skew immediately — the shape of the evidence, a few tasks far slower than the rest in the same stage, is the definition.",
      "Explains the mechanism: rows are partitioned by a join or group key's hash, so all rows sharing a hot key land on one task, and that task does proportionally all the work.",
      "Investigates before fixing: counts rows per key to find the hot ones, rather than assuming.",
      "Expects the hot key to be a default or placeholder — NULL, 0, 'unknown', a guest user id — which is how skew usually arrives.",
      "Offers fixes matched to the cause: filter NULL keys out where they mean 'no match', salt the hot key, broadcast the small side if one side is small, or enable adaptive query execution and let the engine split the skewed partition.",
      "Notes that more executors will not help, because the bottleneck is one task rather than total capacity — this is the insight the question exists to find.",
      "Asks what changed forty minutes ago: skew usually appears when an upstream source starts emitting a placeholder value.",
    ],
    modelAnswer: [
      "That pattern is skew, and the evidence is already conclusive. When 198 tasks in a stage finish in a minute and two run for hours, the work is not evenly distributed across keys — it is not that the cluster is too small.",
      "The mechanism is the shuffle. Rows are assigned to tasks by hashing the join or group key, so every row that shares a key ends up in the same task. One key with a hundred million rows means one task with a hundred million rows, and adding executors gives that task no help at all. That is the thing I would want to say explicitly, because the instinctive fix is to scale up, and it buys nothing.",
      "So I would count rows per key on the join column and look at the top ten. In my experience the hot key is almost always a placeholder: NULL, zero, empty string, 'unknown', or a shared guest account.",
      "The fix follows from which it is. If the key is NULL and NULL means no match, filter those rows out before the join — they cannot match anything, and they are the whole problem. If it is a real key that is genuinely enormous, salt it: add a random suffix to split it across tasks, then aggregate in two passes. If one side of the join is small, broadcast it and skip the shuffle altogether. And adaptive query execution will detect and split skewed partitions on its own, which is worth turning on before hand-writing anything.",
      "I would also ask what changed. Forty minutes to six hours is a step change, not growth, and that usually means an upstream system started emitting a default value where it used to emit a real one. Fixing it there is better than salting around it here.",
    ],
    hint: "The evidence in the question is enough to name the problem. The part that separates answers is what you say about adding more executors.",
  },
  {
    kind: "architecture",
    slug: "perf-dbt-run-too-long",
    title: "The dbt run has crept past the SLA",
    category: "performance",
    difficulty: "medium",
    prompt: [
      "Your dbt project has grown to around 300 models. The full run took twenty minutes a year ago and now takes two and a half hours, which puts the morning dashboards past the 7am they are promised for.",
      "Nobody can point at a single slow model.",
      "How would you approach it?",
    ],
    keyPoints: [
      "Uses the artifacts rather than intuition: run_results.json gives the execution time of every model, so the slowest ones are a sort, not a guess.",
      "Separates the two possible shapes — a few very slow models, or hundreds of slightly slow ones — because the response differs completely.",
      "Looks at the DAG's critical path, not just total time. The run is as long as its longest chain, so parallelism may be the constraint rather than any model.",
      "Checks materialisations: tables rebuilt from scratch that could be incremental, views stacked on views so the work happens at query time, ephemeral models pasted into many descendants.",
      "Checks for a full refresh happening unintentionally — a schema change or on_schema_change setting turning an incremental model into a rebuild.",
      "Considers thread count and warehouse size, but as a lever after the shape is understood rather than a first move.",
      "Raises the option of not running everything at once: splitting by tag or selector so the dashboard's lineage runs first.",
      "Treats the SLA as the goal — the dashboards need to be ready by 7am, which is not the same as the run being fast.",
    ],
    modelAnswer: [
      "Nobody can point at a slow model because nobody has looked at the numbers yet — dbt already writes them. run_results.json has the execution time for every model in the run, so the first step is loading those into a table and sorting.",
      "What I want to know from that is the shape. Either a handful of models account for most of the time, which is a tuning problem, or three hundred models each take thirty seconds, which is an architecture problem. They lead to completely different weeks of work.",
      "Then the critical path. Total model time and wall-clock time are different numbers: the run can only be as short as its longest dependency chain, however many threads you have. If the critical path is forty minutes, tuning anything off it changes nothing.",
      "On the models themselves the usual findings are materialisation choices that were right at the old size: tables rebuilt in full that should be incremental, views on views on views so the cost moves to whoever queries them, and an ephemeral model pasted into thirty descendants and recomputed in each. I would also check whether an incremental model is quietly full-refreshing on every run after a schema change, which is easy to miss and expensive.",
      "Threads and warehouse size are levers, but I would pull them after I understood the shape, not before — spending more to run an inefficient DAG faster is a decision, and it should be a deliberate one.",
      "The last thing I would question is the premise. The promise is that dashboards are ready by 7am, not that the project runs quickly. Running the models those dashboards depend on first, as their own selection, may meet the SLA today while the real work continues.",
    ],
    hint: "dbt already records what you need. An answer that starts by reading run_results.json is ahead of one that starts by guessing at materialisations.",
  },
  {
    kind: "architecture",
    slug: "perf-index-or-not",
    title: "Would an index fix this?",
    category: "performance",
    difficulty: "medium",
    prompt: [
      "A Postgres query behind an internal tool takes eleven seconds. A colleague has opened a pull request adding four indexes to the table, and says it now runs in 200 milliseconds on their laptop.",
      "The table takes about two million inserts a day.",
      "What would you want to know before merging it?",
    ],
    keyPoints: [
      "Asks for the plan before and after, not just the timing — a faster query on a laptop with a smaller dataset and a warm cache proves little.",
      "Knows that indexes cost write throughput, and that a table taking two million inserts a day is exactly where that cost lands.",
      "Asks whether all four are needed, or whether one composite index covers the actual predicate. Four separate indexes are often one index and three liabilities.",
      "Checks column order in a composite index against the query's predicates, since the wrong order means it is never used.",
      "Asks whether the eleven seconds is even the problem — how often the query runs, and whether anyone is waiting on it.",
      "Considers alternatives: fixing the predicate so an existing index applies, or accepting eleven seconds for a query that runs twice a day.",
      "Wants it measured against production-shaped data, and the unused indexes dropped later using the database's own usage statistics.",
    ],
    modelAnswer: [
      "The 200 milliseconds on a laptop is the number I trust least. Different data volume, different statistics, a warm cache and no concurrent write load — it tells me the index can be used, not that it will help in production.",
      "So I would ask for EXPLAIN ANALYZE before and after, against production-shaped data, and I would want to see which of the four indexes the plan actually chose. It is common for one to do the work and the other three to sit there.",
      "The part that worries me is the write side. Every index has to be maintained on insert, and this table takes two million a day. Four indexes on a write-heavy table is a real ongoing cost paid to make one read fast, and the pull request is only showing me one side of that trade.",
      "I would also look at whether one composite index covers the predicate instead of four single-column ones, and check the column order matches how the query filters — wrong order and the index is never chosen, so you pay the write cost for nothing.",
      "Then the question nobody asked: how often does this run, and is anyone waiting? Eleven seconds on a query that runs twice a day for one internal tool might be fine. Eleven seconds on a page load is not. That decides how much write throughput is worth spending.",
      "If we do merge it, I would want to come back in a fortnight and check the index usage statistics, and drop the ones with no scans. Indexes are easy to add and nobody ever removes them.",
    ],
    hint: "There are two questions here: does the index work, and is it worth what it costs. The pull request only answers the first.",
  },
];
