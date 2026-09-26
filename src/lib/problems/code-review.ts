/**
 * Code review problems: here is code that runs and is wrong. Find out why.
 *
 * This format is the one every source in the research converged on, from
 * three directions at once.
 *
 * Practitioners nominate it unprompted as the thing that should replace
 * algorithm puzzles: "Why don't interviewers take like 100-200 lines of code
 * from one of their projects, leave in a few of the bugs they previously had,
 * and tell the interviewee they have 15 mins, tell me everything you can about
 * this code." One employer has already shipped it inside a take-home — a
 * deliberately broken model with "list all the issues you find, rewrite it,
 * and be ready to walk through your changes".
 *
 * And it is where interviewing is going. The first item on Zach Wilson's list
 * of how these rounds are changing is "Grinding Leetcode → Correcting
 * AI-Generated Code": interviewers paste code that is subtly wrong and ask you
 * to debug it and explain your reasoning. Senior loops in 2026 are already
 * running an hour on exactly this.
 *
 * The reason it works is that it inverts the usual test. Generating a
 * plausible query is the part that is now nearly free; noticing that a
 * plausible query is wrong is not.
 */

import type { DbtProblem, SqlProblem, ArchitectureProblem } from "./types";

const BILLING_FIXTURE = `
CREATE OR REPLACE TABLE customers (
  customer_id INTEGER, name VARCHAR, region VARCHAR
);
INSERT INTO customers VALUES
  (1,'Adaeze Okafor','NG'),
  (2,'Tunde Bakare','NG'),
  (3,'Wei Chen','SG'),
  (4,'Marta Silva','PT');

CREATE OR REPLACE TABLE subscriptions (
  subscription_id INTEGER, customer_id INTEGER, plan VARCHAR, mrr DECIMAL(10,2)
);
INSERT INTO subscriptions VALUES
  (10,1,'starter',29.00),
  (11,1,'growth', 99.00),
  (12,2,'scale', 299.00),
  (13,3,'starter',29.00);

CREATE OR REPLACE TABLE payments (
  payment_id INTEGER, subscription_id INTEGER, paid_on DATE, amount DECIMAL(10,2)
);
INSERT INTO payments VALUES
  (100,10,DATE '2024-05-01',29.00),
  (101,10,DATE '2024-06-01',29.00),
  (102,11,DATE '2024-05-01',99.00),
  (103,11,DATE '2024-06-01',99.00),
  (104,12,DATE '2024-05-01',299.00),
  (105,13,DATE '2024-05-01',29.00);
`;

export const CODE_REVIEW_SQL: SqlProblem[] = [
  {
    kind: "sql",
    slug: "review-ai-written-revenue-query",
    title: "Review the query the AI wrote",
    category: "pipeline-etl",
    difficulty: "hard",
    prompt: [
      "A colleague asked an assistant for total monthly recurring revenue per paying customer, pasted the result into a dashboard, and shipped it. Finance says one customer's figure is twice what it should be.",
      "The query runs. It returns plausible-looking rows. It is wrong.",
      "Fix it so the result is `name` and `total_mrr` — the sum of that customer's subscription `mrr` — for customers who have made at least one payment, ordered by `total_mrr` descending, then `name`.",
    ],
    notes: [
      "`mrr` is a property of the subscription, not of a payment. Each subscription has exactly one `mrr` however many times it has been paid.",
      "A customer may hold several subscriptions, and each subscription may have been paid many times. Both of those are normal, and together they are what the query does not survive.",
      "Reviewing generated code is now its own interview round. Producing a plausible query is cheap; noticing that a plausible query is wrong is the skill being tested.",
    ],
    tableNotes: {
      customers: "One row per customer. customer_id is the primary key.",
      subscriptions:
        "One row per subscription, carrying its monthly price in mrr. A customer may hold several. customer_id references customers.",
      payments:
        "One row per payment taken. A subscription is paid repeatedly, once per month. subscription_id references subscriptions.",
    },
    setup: BILLING_FIXTURE,
    starter: `-- The query as it was written. It runs, and one figure is wrong.
SELECT
  c.name,
  SUM(s.mrr) AS total_mrr
FROM customers c
JOIN subscriptions s ON s.customer_id = c.customer_id
JOIN payments p ON p.subscription_id = s.subscription_id
GROUP BY c.customer_id, c.name
ORDER BY total_mrr DESC, c.name
`,
    solution: `SELECT c.name, SUM(s.mrr) AS total_mrr
FROM customers c
JOIN subscriptions s ON s.customer_id = c.customer_id
WHERE EXISTS (
  SELECT 1 FROM payments p WHERE p.subscription_id = s.subscription_id
)
GROUP BY c.customer_id, c.name
ORDER BY total_mrr DESC, c.name`,
    orderMatters: true,
    explanation:
      "Adaeze holds two subscriptions priced 29 and 99, so her true monthly recurring revenue is 128. The original query reports 256, because each subscription has been paid twice and joining to payments repeats its mrr once per payment. Tunde and Wei are unaffected — each holds one subscription paid once — which is what makes the bug so easy to miss: two of the three rows are right, and the wrong one is still a plausible number. The join to payments was only ever needed to establish that the customer has paid, and a filter is the right tool for that. EXISTS answers the question without adding rows; aggregating payments separately and joining that would work too.",
    gotcha:
      "Deleting the payments join altogether. The totals then come out right for this fixture, but the query no longer restricts to customers who have paid — it would include a customer who had subscribed and never been charged, which is the population finance specifically excluded.",
    hint: "Count the rows the joins produce before the GROUP BY. Then ask what the payments join was for, and whether a join is the right way to get it.",
  },
  {
    kind: "sql",
    slug: "review-null-filter-bug",
    title: "The filter that lost the rows",
    category: "data-quality",
    difficulty: "medium",
    prompt: [
      "A reconciliation query was written to count orders that are not cancelled. It has been reporting fewer orders than the source system for months and nobody could work out where they went.",
      "Fix it so it returns `status` and `orders` for every non-cancelled status, including the orders whose status was never recorded, ordered by `orders` descending then `status`.",
      "Report a missing status as the literal `'unknown'`.",
    ],
    notes: [
      "`status` is nullable. A NULL means the source never sent one, not that the order was cancelled.",
      "Comparing anything to NULL yields NULL rather than true or false, and a WHERE clause keeps only rows that are true — so a NULL status fails `status != 'cancelled'` silently.",
    ],
    tableNotes: {
      orders:
        "One row per order. order_id is the primary key. status is nullable and is one of 'completed', 'pending', 'cancelled' or NULL.",
    },
    setup: `
CREATE OR REPLACE TABLE orders (
  order_id INTEGER, status VARCHAR, amount DECIMAL(10,2)
);
INSERT INTO orders VALUES
  (101,'completed',150.00),
  (102,'cancelled',220.00),
  (103,NULL,89.50),
  (104,'completed',310.25),
  (105,NULL,75.00),
  (106,'pending',120.00),
  (107,'completed',45.75);
`,
    starter: `-- Reported 4 orders. The source system says 6.
SELECT status, COUNT(*) AS orders
FROM orders
WHERE status != 'cancelled'
GROUP BY status
ORDER BY orders DESC, status
`,
    solution: `SELECT COALESCE(status, 'unknown') AS status, COUNT(*) AS orders
FROM orders
WHERE status IS DISTINCT FROM 'cancelled'
GROUP BY COALESCE(status, 'unknown')
ORDER BY orders DESC, status`,
    orderMatters: true,
    explanation:
      "Six orders are not cancelled: three completed, one pending, and two with no status. The original query returned four, because the two NULL rows were dropped by the filter — `NULL != 'cancelled'` is NULL, not true, so those rows never passed the WHERE clause. They were also the only rows that would have revealed the source system was not sending a status at all. Grouping on COALESCE rather than the raw column is what turns them from invisible into a named 'unknown' bucket, which is the difference between a silent shortfall and a visible data quality problem.",
    gotcha:
      "Fixing it with `WHERE status != 'cancelled' OR status IS NULL` and stopping there. That restores the count, but the two rows still group under NULL and read as an empty label in the dashboard — the reconciliation now matches while the underlying problem stays unreported.",
    hint: "Two separate fixes are needed: one so the NULL rows survive the filter, and one so they are visible in the output rather than grouping under an empty label.",
  },
];

export const CODE_REVIEW_DBT: DbtProblem[] = [
  {
    kind: "dbt",
    slug: "review-broken-dbt-model",
    title: "Rewrite a colleague's model",
    category: "dbt-modelling",
    difficulty: "hard",
    prompt: [
      "You have inherited `mart_customer_revenue` from someone who has left. It compiles and it runs, and two of its numbers are wrong.",
      "Rewrite it to return `customer_id`, `name`, `region` and `revenue` — the total each customer has paid — for every customer including those who have paid nothing, ordered by `customer_id`.",
      "Be able to say what was wrong, not just make it pass. This format is the one employers are moving to precisely because the explanation is the signal.",
    ],
    notes: [
      "There are four distinct problems in the model as written. Three change the result; one is a practice issue that would fail review without changing any number.",
      "A customer with no payments must appear with a revenue of 0, not be dropped.",
    ],
    tableNotes: {
      customers: "One row per customer. customer_id is the primary key.",
      subscriptions:
        "One row per subscription. A customer may hold several. customer_id references customers.",
      payments:
        "One row per payment taken. subscription_id references subscriptions.",
    },
    refs: {
      customers: "customers",
      subscriptions: "subscriptions",
      payments: "payments",
    },
    setup: BILLING_FIXTURE,
    starter: `-- Inherited. Compiles, runs, and is wrong.
-- Find every issue before you rewrite it.

select
    c.customer_id,
    c.name,
    c.region,
    sum(p.amount) as revenue
from customers c
join subscriptions s on s.customer_id = c.customer_id
join payments p on p.subscription_id = s.subscription_id
group by 1, 2, 3
`,
    solution: `with paid as (
    select
        s.customer_id,
        sum(p.amount) as revenue
    from subscriptions s
    join payments p on p.subscription_id = s.subscription_id
    group by s.customer_id
)
select
    c.customer_id,
    c.name,
    c.region,
    coalesce(paid.revenue, 0) as revenue
from customers c
left join paid on paid.customer_id = c.customer_id
order by c.customer_id`,
    orderMatters: true,
    explanation:
      "Marta has never paid, and the original model drops her entirely: an inner join to payments removes any customer without one, so a customer dimension quietly becomes a customer-who-has-paid dimension. Aggregating payments to the customer first, then left joining, keeps her with a revenue of 0. The other three issues: the model queries raw table names instead of ref(), so dbt does not know it depends on anything and may build it before its sources; there is no ordering despite the output being consumed as a report; and group by 1, 2, 3 is positional, which silently regroups the whole model the day somebody inserts a column.",
    gotcha:
      "Rewriting until the numbers match and stopping. The missing ref() calls change no value today and are the most serious defect in the file — dbt cannot order a build around a dependency it cannot see.",
    hint: "Ask which customers the original can never return, whatever the data. Then look at what the model tells dbt about its own dependencies.",
  },
];

export const CODE_REVIEW_DESIGN: ArchitectureProblem[] = [
  {
    kind: "architecture",
    slug: "review-python-loader",
    title: "Review this loader before it goes to production",
    category: "pipeline-etl",
    difficulty: "hard",
    prompt: [
      "A colleague has opened a pull request with the loader below. It works on their machine against a sample file. It is scheduled to run nightly over roughly 40 million rows.",
      "Tell them everything you can about this code.",
      "```",
      "def load_orders(path, conn):",
      "    rows = open(path).readlines()",
      "    orders = []",
      "    for line in rows:",
      "        parts = line.split(',')",
      "        orders.append({",
      "            'id': parts[0],",
      "            'customer': parts[1],",
      "            'amount': float(parts[2]),",
      "            'placed_at': parts[3],",
      "        })",
      "    for o in orders:",
      "        conn.execute(",
      "            \"INSERT INTO orders VALUES ('%s','%s',%s,'%s')\"",
      "            % (o['id'], o['customer'], o['amount'], o['placed_at'])",
      "        )",
      "    conn.commit()",
      "```",
    ],
    notes: [
      "This is a code review, not a rewrite. The interviewer is listening for what you notice and how you rank it, so say which of these you would block the pull request over and which you would leave as a comment.",
    ],
    keyPoints: [
      "Memory: readlines() loads the whole file, and the parsed list holds a dict per row on top of it. At 40 million rows this does not run. Streaming the file line by line, or in chunks, is the fix.",
      "SQL injection and correctness: the insert is built by string formatting, so any comma-free apostrophe in a customer name breaks the statement or worse. Parameterised queries, always.",
      "Not idempotent: a plain INSERT means a rerun after a partial failure duplicates rows. The load needs to be an upsert, or to write to a staging table and swap.",
      "No transaction boundary until the end, so a failure at row 39,000,000 leaves nothing committed and all the work lost — and combined with the previous point, the retry then duplicates whatever did land.",
      "Row-by-row inserts over 40 million rows will take hours. Batch them, or use the database's bulk load path.",
      "No error handling on parsing: one malformed line raises and kills the entire run. Bad rows should be quarantined with a reason.",
      "float for money. Amounts should be a decimal type; floating point silently loses pennies and the totals will not reconcile.",
      "No CSV parser: split(',') breaks on any quoted field containing a comma, which in an orders file means any address or company name.",
      "The file handle is never closed, and there is no context manager.",
      "No logging, no row counts, no way to tell afterwards what it did.",
      "Ranks them rather than listing them flat — the injection and the idempotency are blocking, the missing logging is a comment.",
    ],
    modelAnswer: [
      "I would block this, and I would want to be clear about which parts are blocking versus which are style, because a review that lists eleven things at equal weight is not useful to the author.",
      "The two that stop it going anywhere near production: the SQL is built by string interpolation, which is an injection hole and will also simply break on any name containing an apostrophe; and the load is not idempotent, so any partial failure followed by a retry duplicates rows. Those two are not preferences.",
      "Then the ones that mean it will not work at the stated scale. readlines() pulls the entire file into memory and then a second structure is built alongside it — at 40 million rows that fails outright. And inserting row by row will take hours where a batched insert or the database's bulk path takes minutes. The commit at the very end compounds both: a failure near the end loses every row of work.",
      "Then correctness details that will produce wrong numbers rather than errors, which makes them worse in a way. Money is being parsed as float, and floating point will lose fractions of a penny across 40 million rows until finance cannot reconcile. And splitting on commas rather than using a CSV reader breaks on any quoted field containing a comma — in an orders file, that is every address.",
      "Then robustness: one malformed line raises and kills the run, when bad rows should go to a quarantine table with a reason. The file is never closed. And there is no logging at all, so when this does fail at 3am, whoever is on call has no idea how far it got.",
      "What I would actually say to the author is shorter than that. Parameterise the SQL, make the load idempotent, stream the file and batch the inserts, and use Decimal for the amount. The rest I would leave as comments. And I would ask whether we need to write this at all, because a bulk load from the database's own tooling would be less code and faster than any version of this.",
    ],
    hint: "There are two categories here: things that make it wrong, and things that make it not run at 40 million rows. A strong review separates them and says which blocks the merge.",
  },
];
