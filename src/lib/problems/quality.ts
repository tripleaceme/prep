/**
 * Data quality problems.
 *
 * Written as detection queries rather than as prose about testing, because
 * that is the actual skill: given a table that is wrong, write the query that
 * finds the wrongness, and have it return nothing when the table is fine.
 *
 * That convention — a check returns the offending rows, and an empty result
 * means it passed — is how dbt tests, Great Expectations and Soda all work, so
 * practising it here is practising the thing itself.
 */

import type { SqlProblem } from "./types";

/**
 * One deliberately broken warehouse, reused across the section.
 *
 * Every defect in it is one somebody has actually shipped: a re-sent batch
 * that duplicated a key, an order pointing at a customer who was deleted, a
 * status that arrived in three different casings, a negative amount from a
 * refund written as a sale, and a table that quietly stopped loading.
 */
const QUALITY_FIXTURE = `
CREATE OR REPLACE TABLE orders (
  order_id INTEGER, customer_id INTEGER, ordered_on DATE,
  status VARCHAR, amount DECIMAL(10,2), loaded_at TIMESTAMP
);
INSERT INTO orders VALUES
  (101,1,DATE '2024-05-01','completed',150.00,TIMESTAMP '2024-05-02 02:00:00'),
  (102,1,DATE '2024-05-02','COMPLETED',89.50,TIMESTAMP '2024-05-03 02:00:00'),
  (103,2,DATE '2024-05-02','completed',220.00,TIMESTAMP '2024-05-03 02:00:00'),
  (103,2,DATE '2024-05-02','completed',220.00,TIMESTAMP '2024-05-03 02:05:00'),
  (104,9,DATE '2024-05-03','Completed',310.25,TIMESTAMP '2024-05-04 02:00:00'),
  (105,3,DATE '2024-05-03','refunded',-75.00,TIMESTAMP '2024-05-04 02:00:00'),
  (106,3,DATE '2024-05-04','pending',NULL,TIMESTAMP '2024-05-05 02:00:00'),
  (107,NULL,DATE '2024-05-04','completed',45.75,TIMESTAMP '2024-05-05 02:00:00'),
  (108,2,DATE '2024-05-05','completed',500.00,TIMESTAMP '2024-05-06 02:00:00'),
  (108,2,DATE '2024-05-05','completed',500.00,TIMESTAMP '2024-05-06 02:00:00');

CREATE OR REPLACE TABLE customers (
  customer_id INTEGER, email VARCHAR, country VARCHAR
);
INSERT INTO customers VALUES
  (1,'adaeze@example.com','NG'),
  (2,'tunde@example.com','NG'),
  (3,'wei@example.sg','SG'),
  (4,'ADAEZE@example.com','NG');

CREATE OR REPLACE TABLE table_loads (
  table_name VARCHAR, loaded_at TIMESTAMP, row_count INTEGER
);
INSERT INTO table_loads VALUES
  ('orders',  TIMESTAMP '2024-05-06 02:00:00',10),
  ('customers',TIMESTAMP '2024-05-06 02:00:00',4),
  ('events',  TIMESTAMP '2024-05-02 02:00:00',5120),
  ('refunds', TIMESTAMP '2024-05-06 02:00:00',12);

CREATE OR REPLACE TABLE daily_revenue (
  revenue_date DATE, revenue DECIMAL(12,2)
);
INSERT INTO daily_revenue VALUES
  (DATE '2024-05-01',1200.00),
  (DATE '2024-05-02',1180.00),
  (DATE '2024-05-03',1240.00),
  (DATE '2024-05-04',1195.00),
  (DATE '2024-05-05',60.00),
  (DATE '2024-05-06',1210.00);
`;

export const QUALITY_PROBLEMS: SqlProblem[] = [
  {
    kind: "sql",
    slug: "dq-duplicate-primary-key",
    title: "The key that isn't unique",
    category: "data-quality",
    difficulty: "easy",
    prompt: [
      "`order_id` is supposed to be the primary key of `orders`. A re-sent batch means it isn't.",
      "Write the check: return every `order_id` that appears more than once, with `copies`, ordered by `order_id`.",
      "Note the convention this whole section uses — a check returns the offending rows, and an empty result means it passed. That is how dbt tests, Great Expectations and Soda all behave, so a check that returns a count instead of the rows is a check you can't debug.",
    ],
    setup: QUALITY_FIXTURE,
    starter: "SELECT order_id, COUNT(*) AS copies\nFROM orders\n",
    solution: `SELECT order_id, COUNT(*) AS copies
FROM orders
GROUP BY order_id
HAVING COUNT(*) > 1
ORDER BY order_id`,
    orderMatters: true,
    hint: "Group by the key and keep the groups with more than one row. HAVING, not WHERE — the duplication is a fact about the group.",
  },
  {
    kind: "sql",
    slug: "dq-orphaned-foreign-key",
    title: "Orders pointing at nobody",
    category: "data-quality",
    difficulty: "medium",
    prompt: [
      "Every order should belong to a customer in `customers`. Some don't — a customer was hard-deleted upstream, and one row arrived with no customer at all.",
      "Return `order_id` and `customer_id` for orders whose `customer_id` has no match in `customers`, ordered by `order_id`.",
      "A NULL `customer_id` is also a failure here, and it is the case most people's first attempt misses: `NOT IN` against a subquery returns nothing at all once a NULL is involved, so the check silently passes.",
    ],
    setup: QUALITY_FIXTURE,
    starter: "SELECT DISTINCT o.order_id, o.customer_id\nFROM orders o\n",
    solution: `SELECT DISTINCT o.order_id, o.customer_id
FROM orders o
LEFT JOIN customers c ON c.customer_id = o.customer_id
WHERE c.customer_id IS NULL
ORDER BY o.order_id`,
    orderMatters: true,
    hint: "LEFT JOIN to customers and keep the rows where the join found nothing. That catches the NULL too, which is exactly what NOT IN would not.",
  },
  {
    kind: "sql",
    slug: "dq-inconsistent-categories",
    title: "One status, three spellings",
    category: "data-quality",
    difficulty: "easy",
    prompt: [
      "`status` is supposed to come from a fixed set. It arrives as `completed`, `COMPLETED` and `Completed`, so every `GROUP BY status` splits one category into three and every dashboard is wrong.",
      "Return `normalised` (the lowercased status), `variants` (how many distinct spellings arrived) and `rows` (how many rows in total), for statuses that arrived in more than one spelling.",
      "Order by `normalised`.",
    ],
    setup: QUALITY_FIXTURE,
    starter: "SELECT LOWER(status) AS normalised\nFROM orders\n",
    solution: `SELECT
  LOWER(status) AS normalised,
  COUNT(DISTINCT status) AS variants,
  COUNT(*) AS rows
FROM orders
GROUP BY LOWER(status)
HAVING COUNT(DISTINCT status) > 1
ORDER BY normalised`,
    orderMatters: true,
    hint: "Group by LOWER(status), then count the DISTINCT raw values inside each group — more than one means the spelling is inconsistent.",
  },
  {
    kind: "sql",
    slug: "dq-accepted-values-and-nulls",
    title: "Values that should never have got in",
    category: "data-quality",
    difficulty: "medium",
    prompt: [
      "Finance has three rules for `orders`: `amount` is never NULL, `amount` is never negative on a `completed` order, and `customer_id` is never NULL.",
      "Write one check that returns every row breaking any of them: `order_id` and `issue`, where `issue` is `'null amount'`, `'negative amount'` or `'null customer'`.",
      "A row can break only one rule here. Order by `order_id`.",
      "Doing this as one query rather than three is the point — one check that names what is wrong is far more useful on call than three that each say pass or fail.",
    ],
    setup: QUALITY_FIXTURE,
    starter: `SELECT
  order_id,
  CASE
    -- name each failure
  END AS issue
FROM orders
`,
    solution: `SELECT
  order_id,
  CASE
    WHEN amount IS NULL THEN 'null amount'
    WHEN status = 'completed' AND amount < 0 THEN 'negative amount'
    WHEN customer_id IS NULL THEN 'null customer'
  END AS issue
FROM orders
WHERE amount IS NULL
   OR (status = 'completed' AND amount < 0)
   OR customer_id IS NULL
ORDER BY order_id`,
    orderMatters: true,
    hint: "A CASE expression names the issue; the WHERE clause repeats the same three conditions so only failing rows come back.",
  },
  {
    kind: "sql",
    slug: "dq-freshness-check",
    title: "The table that quietly stopped loading",
    category: "data-quality",
    difficulty: "medium",
    prompt: [
      "`table_loads` records when each table last landed and how many rows came with it. One table stopped loading days ago and nothing alerted, because nothing failed — it simply never ran.",
      "Treating `2024-05-06 02:00:00` as the most recent successful run, return `table_name` and `hours_stale` for every table whose `loaded_at` is more than 24 hours behind it. Most stale first.",
      "Freshness is the check people add last and need first. A failing job pages someone; a job that silently stops running does not.",
    ],
    setup: QUALITY_FIXTURE,
    starter: "SELECT table_name, ...\nFROM table_loads\n",
    solution: `SELECT
  table_name,
  DATE_DIFF('hour', loaded_at, TIMESTAMP '2024-05-06 02:00:00') AS hours_stale
FROM table_loads
WHERE DATE_DIFF('hour', loaded_at, TIMESTAMP '2024-05-06 02:00:00') > 24
ORDER BY hours_stale DESC`,
    orderMatters: true,
    hint: "DATE_DIFF('hour', loaded_at, the reference timestamp) gives the lag; filter on it and order by it descending.",
  },
  {
    kind: "sql",
    slug: "dq-volume-anomaly",
    title: "The day the numbers collapsed",
    category: "data-quality",
    difficulty: "hard",
    prompt: [
      "`daily_revenue` looks healthy until one day drops to a twentieth of normal — a partial load nobody noticed, because the job succeeded.",
      "Write an anomaly check: return `revenue_date`, `revenue` and `avg_revenue` (the average of the three days before it) for any day whose revenue is less than half that average.",
      "Days without three prior days can't be judged, so exclude them. Order by `revenue_date`.",
      "Comparing against a trailing window rather than a fixed threshold is what makes a check survive growth — a hardcoded floor either fires constantly or never fires again.",
    ],
    setup: QUALITY_FIXTURE,
    starter: `WITH windowed AS (
  SELECT
    revenue_date,
    revenue,
    -- average of the three preceding days
  FROM daily_revenue
)
SELECT ...
`,
    solution: `WITH windowed AS (
  SELECT
    revenue_date,
    revenue,
    AVG(revenue) OVER (
      ORDER BY revenue_date
      ROWS BETWEEN 3 PRECEDING AND 1 PRECEDING
    ) AS avg_revenue,
    COUNT(*) OVER (
      ORDER BY revenue_date
      ROWS BETWEEN 3 PRECEDING AND 1 PRECEDING
    ) AS prior_days
  FROM daily_revenue
)
SELECT revenue_date, revenue, avg_revenue
FROM windowed
WHERE prior_days = 3
  AND revenue < avg_revenue * 0.5
ORDER BY revenue_date`,
    orderMatters: true,
    hint: "ROWS BETWEEN 3 PRECEDING AND 1 PRECEDING averages the three days before each row without including the row itself. Count over the same frame to know whether three days actually existed.",
  },
  {
    kind: "sql",
    slug: "dq-case-insensitive-duplicates",
    title: "The same person, twice",
    category: "data-quality",
    difficulty: "medium",
    prompt: [
      "`customers.email` has a unique constraint, so the database is satisfied. Two rows are still the same person — the addresses differ only in case.",
      "Return `normalised` (the lowercased email) and `accounts` (how many rows share it) for every address held by more than one account. Order by `normalised`.",
      "This is the duplicate class that unique constraints never catch, and it is why deduplication belongs in a test rather than only in the schema.",
    ],
    setup: QUALITY_FIXTURE,
    starter: "SELECT LOWER(email) AS normalised, COUNT(*) AS accounts\nFROM customers\n",
    solution: `SELECT LOWER(email) AS normalised, COUNT(*) AS accounts
FROM customers
GROUP BY LOWER(email)
HAVING COUNT(*) > 1
ORDER BY normalised`,
    orderMatters: true,
    hint: "Group by the normalised form, not the raw column — that is the whole trick.",
  },
];
