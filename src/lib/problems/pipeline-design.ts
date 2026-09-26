/**
 * Pipeline and system design problems.
 *
 * These exist because of a measured gap. Across a large sample of graded
 * attempts, candidates pass 91% of SQL problems they attempt, 48% of data
 * modelling problems, and 28% of pipeline design problems — and at staff
 * level, pipeline design is most of the loop. A practice library weighted
 * towards SQL is weighted towards the round people already pass.
 *
 * Topic choice is not guesswork either. Across 144 pipeline design problems
 * collected from real loops, the concepts that recur are idempotency (95%),
 * data quality checks (89%), monitoring and alerting (86%), partitioning
 * (84%), retries (76%), deduplication (74%) and full-versus-incremental
 * (72%). Every problem below is built on several of those.
 *
 * Self-assessed, because the round is a whiteboard conversation. The format
 * that interviewers use — and the one worth practising — starts broad and
 * escalates, so several of these carry the follow-ups the interviewer would
 * push back with.
 */

import type { ArchitectureProblem } from "./types";

export const PIPELINE_DESIGN_PROBLEMS: ArchitectureProblem[] = [
  {
    kind: "architecture",
    slug: "pd-nightly-load",
    title: "Design the nightly load from Postgres",
    category: "pipeline-etl",
    difficulty: "medium",
    prompt: [
      "A production Postgres database holds orders, customers and products. Analysts want it in the warehouse, refreshed daily, ready by 7am.",
      "Design the pipeline.",
      "Then answer the two things the interviewer will push on: what happens when the run fails halfway, and what happens when the orders table gets too big to copy every night.",
    ],
    keyPoints: [
      "Asks about volumes, the acceptable freshness, and whether the source can take the read load before designing anything — skipping the clarifying step is the most common reason this round is failed.",
      "Does not query production directly for a full extract, or explains why a read replica is needed if it does.",
      "Makes the load idempotent so a rerun produces the same result: write to a staging location and swap, or delete-and-insert the partition, rather than appending.",
      "Separates extract, load and transform so a transform bug does not require re-extracting from the source.",
      "Moves from full copy to incremental using an updated_at watermark, and knows the two traps — rows updated during the extract, and hard deletes that an updated_at filter can never see.",
      "Names the answer to deletes explicitly: soft deletes, a periodic full reconcile, or CDC from the write-ahead log.",
      "Has a completeness signal rather than only a schedule, so downstream models wait for data to land rather than for the clock.",
      "Adds freshness and row-count checks that alert before 7am rather than after.",
    ],
    modelAnswer: [
      "Before designing I would want three numbers: how many rows are in the biggest table, how much they change per day, and how stale the data is allowed to be. A design for ten million orders is not the design for ten billion, and this round is usually failed by drawing before asking.",
      "Assuming a moderate size to start: extract from a read replica rather than the primary, so analytics load cannot affect the application. Land the raw extract in object storage partitioned by date, then load into raw tables, then transform. Keeping those three steps separate matters because when the transform is wrong — and it will be — I want to fix and rerun it without going back to the source.",
      "On failure halfway: the load has to be idempotent, which means rerunning it produces the same table rather than a doubled one. I would write each day's data to a staging table and swap it in, or delete the target partition and reinsert. What I would avoid is appending, because then a partial run leaves rows behind and the rerun duplicates them — and that is the failure mode where nobody notices until a total is wrong.",
      "On the table getting too big: move to incremental using an updated_at watermark, taking rows newer than the last successful run. Two traps come with that. Rows updated while the extract is running can be missed, so I would use the run's start time rather than its end time and accept re-reading a small overlap. And hard deletes are invisible to an updated_at filter — a deleted row simply stops appearing and the warehouse keeps it forever. That needs either soft deletes upstream, a weekly full reconcile, or reading the write-ahead log with CDC.",
      "For the 7am promise: downstream models should trigger on a completeness signal from the load rather than on their own schedule, so a late extract delays the models rather than having them run on yesterday's data. And I would alert on freshness and row count before 7am, because the current design tells you it failed by an analyst noticing.",
    ],
    hint: "Two minutes of clarifying questions before drawing is the single biggest difference between a pass and a no-hire in this round.",
  },
  {
    kind: "architecture",
    slug: "pd-backfill-two-years",
    title: "Backfill two years without breaking today",
    category: "pipeline-etl",
    difficulty: "hard",
    prompt: [
      "A bug in a transform means two years of a daily table are wrong. It has to be reprocessed.",
      "The same pipeline runs every night for the current day, the warehouse is shared with everyone else's jobs, and the table feeds dashboards people are using right now.",
      "Design the backfill.",
    ],
    keyPoints: [
      "Separates the backfill from the nightly run so the two do not collide, and says how — a separate warehouse, a lower priority, or a window when the cluster is quiet.",
      "Batches by date range rather than running two years as one statement, with a stated concurrency limit.",
      "Requires the transform to be idempotent and parameterised by date, so reprocessing a day is the same operation as running it normally.",
      "Runs oldest-first or newest-first deliberately, and can justify the choice — newest-first means a half-finished backfill leaves the recent data correct.",
      "Validates on a sample before running all of it: reprocess one day, compare against the old output, confirm the difference is what was expected.",
      "Plans for the backfill itself being wrong — writing to a parallel table and swapping, so there is a way back.",
      "Handles the dashboards: either accept the numbers moving, or write to a shadow table and cut over once, rather than having figures change under people silently.",
      "Notes the cost, and that a two-year reprocess is a spend decision somebody should agree to.",
    ],
    modelAnswer: [
      "The first thing I would establish is whether the transform is idempotent and takes a date as a parameter. If reprocessing a day is not just the nightly job pointed at an older date, that is the thing to fix before backfilling anything — otherwise I am writing a second implementation and betting the two agree.",
      "Then I would prove it on one day. Reprocess a single date into a separate location, diff it against what is currently there, and confirm the difference is exactly the bug I think I am fixing. That step has saved me from backfilling a second bug on top of the first.",
      "For the run itself: batch by date range with a concurrency cap — five days in flight, not seven hundred — and keep it off the path of the nightly job, either on a separate warehouse or in a window when the cluster is quiet. Sharing capacity with tonight's production run is how a backfill turns into an incident.",
      "I would go newest-first. If the backfill is stopped halfway, I would rather the recent data everyone actually looks at be correct and the old data still wrong, than the reverse.",
      "I would write to a parallel table rather than in place, and swap when it is complete and checked. That gives a way back if the new logic turns out to be wrong too, and it means the dashboards change once at a moment I choose rather than drifting for three days while the backfill runs.",
      "Last, two conversations rather than technical steps. Somebody owns the cost of reprocessing two years and should agree to it beforehand. And whoever reports these numbers needs to know they are about to move, with the old and new side by side for a period — a number that silently changes is worse than one that was wrong consistently.",
    ],
    hint: "There are two failure modes to design against: the backfill breaking production, and the backfill itself being wrong.",
  },
  {
    kind: "architecture",
    slug: "pd-where-bad-rows-go",
    title: "Where do the bad rows go?",
    category: "pipeline-etl",
    difficulty: "medium",
    prompt: [
      "Your ingestion pipeline processes a few million records a night from an external partner. About 0.1% of them are malformed — missing required fields, unparseable dates, foreign keys pointing at nothing.",
      "Right now the job fails on the first bad record and someone fixes it by hand in the morning.",
      "Design something better. Be specific about what happens to a bad row.",
    ],
    keyPoints: [
      "Rejects both extremes: failing the whole load on one bad row, and silently dropping bad rows so nobody ever learns about them.",
      "Routes rejects to a quarantine or dead-letter table that keeps the original record and the reason it failed.",
      "Keeps the raw payload unchanged alongside the parsed version, so a row can be reprocessed once the parser is fixed rather than lost.",
      "Distinguishes a row-level defect from a systemic one, and sets a threshold — 0.1% is a quarantine, 40% means the feed itself changed and the load should stop.",
      "Alerts on the rate changing rather than on any rejection at all, since a constant trickle is normal and a spike is not.",
      "Makes reprocessing from quarantine a first-class path rather than a manual fix.",
      "Mentions a data contract with the partner so the shape cannot change without notice.",
      "Notes that quarantined rows mean totals are incomplete, and that downstream consumers should be able to see that.",
    ],
    modelAnswer: [
      "Failing the entire load on one malformed record is the wrong default at this rate — 0.1% of a few million is a few thousand rows a night, so the pipeline would essentially never complete. But the opposite instinct, filtering them out quietly, is worse, because then nobody finds out the partner has been sending broken data for six weeks.",
      "So: parse defensively and route rejects to a quarantine table that holds the original record exactly as it arrived, the reason it failed, and the run it came from. The reason matters as much as the row — 'unparseable date' and 'customer_id not found' lead to completely different fixes.",
      "I would also keep the raw payload landed unchanged before parsing. That way when the parser is corrected, the quarantined rows can be reprocessed rather than needing to be requested from the partner again.",
      "The important design decision is the threshold. A few rejected rows are a data quality observation; a large fraction is the feed having changed shape, and continuing to load would publish a partial number as though it were complete. So I would fail the run above some percentage — and I would want that percentage agreed rather than invented by me, because it is a business decision about whether a 95% complete number is useful.",
      "For alerting, I would alert on the rate moving rather than on any rejection. A steady 0.1% is the normal state of an external feed and paging on it teaches people to ignore the alert. A jump to 4% overnight is the thing worth waking up for.",
      "Two things beyond the pipeline. Reprocessing from quarantine should be a routine operation rather than someone editing rows by hand at 8am. And this is the argument for a data contract with the partner — the reason a required field went missing is usually that someone changed a system without knowing we depended on it.",
    ],
    hint: "The answer is not 'validate the data'. It is what specifically happens to one bad row, and what makes the pipeline stop rather than continue.",
  },
  {
    kind: "architecture",
    slug: "pd-escalating-scale",
    title: "Now do it at a hundred times the volume",
    category: "pipeline-etl",
    difficulty: "hard",
    prompt: [
      "A small e-commerce business wants analytics. A few thousand orders a day, one Postgres database, one analyst. Design the data infrastructure.",
      "Then redesign it three times, as the interviewer escalates:",
      "First, the orders table passes 100GB and analysts want to query the full history. Second, the business needs the gap between an order being placed and appearing in analytics to be under five minutes. Third, the analytics have to be served back into the customer-facing web application.",
    ],
    notes: [
      "This is the shape most system design rounds take — a deliberately simple opening, then constraints added one at a time to find where your design breaks.",
      "Each stage should change your answer. A design that does not move when the constraints move is a sign of having memorised one architecture.",
    ],
    keyPoints: [
      "Starts genuinely small: a nightly dump into the same database or a cheap managed warehouse, and a BI tool. Resists building for scale nobody has.",
      "At 100GB, moves to a columnar warehouse and explains why that shape of storage suits scans over a few columns of many rows, and introduces partitioning on the column that queries filter by.",
      "Recognises the five-minute requirement as a change in kind rather than degree — a batch schedule cannot be tightened indefinitely, and the answer is CDC or event streaming rather than a cron every four minutes.",
      "Reaches for the database's change log rather than polling with a timestamp, and can say why polling misses deletes and hammers the source.",
      "For the customer-facing stage, separates the analytical store from the serving store: a warehouse built for scans is the wrong thing behind a page load that needs single-digit milliseconds.",
      "Proposes precomputing the serving values on a schedule into a key-value or OLAP store, rather than querying the warehouse live from the application.",
      "Names the cost and operational burden at each escalation, and says what they would need in return before spending it.",
      "Keeps saying what they would not build yet.",
    ],
    modelAnswer: [
      "At a few thousand orders a day, the honest answer is almost nothing. A nightly dump into a managed warehouse on the smallest tier, a handful of transformations in version control, and a BI tool. At that volume even a read replica with some views would do. Building a streaming platform here is a mistake I have seen made more than once, and the cost is not the infrastructure bill, it is that the one analyst spends their year maintaining it.",
      "At 100GB with queries over full history, storage shape starts to matter. A columnar warehouse, because analytical queries touch a few columns across many rows and columnar storage lets the engine read only those. Partition on the column people filter by, which is almost always a date, so a query for last month reads last month. This is also the point where I would separate raw from modelled data properly, because reprocessing gets expensive enough that you do not want to re-extract to fix a transform.",
      "The five-minute requirement is the one that actually changes the architecture. You cannot get there by running the batch job more often — at some point the extract takes longer than the interval, and you are just running a slow job continuously against production. So: change data capture off the database's write-ahead log into a stream, and consume that into the warehouse. Reading the log rather than polling on updated_at also fixes deletes, which polling cannot see at all.",
      "Serving it back into the application is a different system again, and I would push back before building it. A warehouse is built for scanning millions of rows in seconds; a product page needs one answer in milliseconds, at whatever concurrency the site has. Querying the warehouse from the application would be slow, expensive per query, and would fall over under traffic.",
      "So I would precompute. Whatever the page needs — a recommendation, a count, a rank — computed on a schedule or from the stream, and written into a key-value store or a serving-shaped OLAP store that the application reads. The warehouse becomes the thing that produces those values, not the thing serving them.",
      "Through all of it the question I would keep asking is what we get for the cost. The step from nightly to five minutes is a large increase in complexity and on-call burden, and it is worth it if a real decision depends on the freshness. If it turns out someone just prefers to see today's orders on a dashboard, hourly would do and would cost a fraction.",
    ],
    hint: "Each escalation should change the design. Notice which one is a difference in kind rather than degree — that is the one being tested.",
  },
];
