/**
 * SQL problems.
 *
 * Deliberately not LeetCode. Where a general-purpose set ships arrays, strings
 * and two-pointer puzzles, these are what an analytics or data engineer is
 * actually asked to do at a keyboard: shape a result set, get a window
 * function right, and find why a pipeline is producing wrong numbers.
 *
 * Every problem is self-contained — `setup` builds its own fixture, `solution`
 * produces the expected result, and the two are compared in the browser.
 */

import type { DbtProblem, SqlProblem } from "./types";

/* Shared fixtures ---------------------------------------------------------- */

const ORDERS_FIXTURE = `
CREATE OR REPLACE TABLE customers (
  customer_id INTEGER, name VARCHAR, country VARCHAR, signed_up_on DATE, is_active BOOLEAN
);
INSERT INTO customers VALUES
  (1,'Adaeze Okafor','NG',DATE '2024-01-15',TRUE),
  (2,'Tunde Bakare','NG',DATE '2024-02-03',TRUE),
  (3,'Marta Silva','PT',DATE '2024-02-20',FALSE),
  (4,'Wei Chen','SG',DATE '2024-03-11',TRUE),
  (5,'Amara Nwosu','NG',DATE '2024-04-02',TRUE),
  (6,'Liam Byrne','IE',DATE '2024-04-18',FALSE);

CREATE OR REPLACE TABLE orders (
  order_id INTEGER, customer_id INTEGER, ordered_on DATE, status VARCHAR, amount DECIMAL(10,2)
);
INSERT INTO orders VALUES
  (101,1,DATE '2024-03-01','completed',150.00),
  (102,1,DATE '2024-03-18','completed',89.50),
  (103,2,DATE '2024-03-05','cancelled',220.00),
  (104,2,DATE '2024-04-09','completed',310.25),
  (105,4,DATE '2024-04-15','completed',75.00),
  (106,4,DATE '2024-05-02','pending',120.00),
  (107,1,DATE '2024-05-11','completed',45.75),
  (108,5,DATE '2024-05-20','completed',500.00),
  (109,4,DATE '2024-06-01','completed',260.40),
  (110,2,DATE '2024-06-14','completed',95.00);
`;

const EVENTS_FIXTURE = `
CREATE OR REPLACE TABLE daily_revenue (
  revenue_date DATE, revenue DECIMAL(12,2)
);
INSERT INTO daily_revenue VALUES
  (DATE '2024-05-01',1200.00),(DATE '2024-05-02',980.50),(DATE '2024-05-03',1450.25),
  (DATE '2024-05-04',760.00),(DATE '2024-05-05',1890.75),(DATE '2024-05-06',1120.00),
  (DATE '2024-05-07',1330.40);
`;

const PRODUCTS_FIXTURE = `
CREATE OR REPLACE TABLE product_sales (
  product VARCHAR, category VARCHAR, units_sold INTEGER
);
INSERT INTO product_sales VALUES
  ('Widget A','Hardware',420),('Widget B','Hardware',380),('Widget C','Hardware',510),
  ('Widget D','Hardware',290),('Report Pro','Software',610),('Sync Lite','Software',450),
  ('Sync Pro','Software',720),('Dash Free','Software',180),
  ('Support Basic','Services',330),('Support Plus','Services',290);
`;


/* Case-study fixtures ------------------------------------------------------
   A single subscription business, reused across several problems, so the
   scenario carries over instead of restarting with every question. */

const SUBSCRIPTIONS_FIXTURE = `
CREATE OR REPLACE TABLE subscriptions (
  subscription_id INTEGER, account_id INTEGER, plan VARCHAR,
  started_on DATE, cancelled_on DATE, mrr DECIMAL(10,2)
);
INSERT INTO subscriptions VALUES
  (1,10,'starter',DATE '2024-01-05',NULL,29.00),
  (2,11,'growth', DATE '2024-01-18',DATE '2024-04-02',99.00),
  (3,12,'starter',DATE '2024-02-02',DATE '2024-02-27',29.00),
  (4,13,'scale',  DATE '2024-02-14',NULL,299.00),
  (5,14,'growth', DATE '2024-03-01',NULL,99.00),
  (6,15,'starter',DATE '2024-03-20',DATE '2024-06-11',29.00),
  (7,16,'growth', DATE '2024-04-04',NULL,99.00),
  (8,17,'scale',  DATE '2024-05-09',DATE '2024-05-30',299.00);

CREATE OR REPLACE TABLE usage_events (
  account_id INTEGER, occurred_at TIMESTAMP, feature VARCHAR
);
INSERT INTO usage_events VALUES
  (10,TIMESTAMP '2024-05-01 09:00:00','query'),
  (10,TIMESTAMP '2024-05-01 09:04:00','query'),
  (10,TIMESTAMP '2024-05-01 10:30:00','export'),
  (11,TIMESTAMP '2024-05-01 11:00:00','query'),
  (13,TIMESTAMP '2024-05-02 08:00:00','dashboard'),
  (13,TIMESTAMP '2024-05-02 08:20:00','query'),
  (13,TIMESTAMP '2024-05-02 12:00:00','query'),
  (14,TIMESTAMP '2024-05-03 14:00:00','export');
`;


/* Fixtures for the archetype questions — the shapes that come up on every
   practice site and in most first-round screens. */

const SALARIES_FIXTURE = `
CREATE OR REPLACE TABLE employees (
  employee_id INTEGER, name VARCHAR, department VARCHAR, salary INTEGER
);
INSERT INTO employees VALUES
  (1,'Adaeze Okafor','Data',	 95000),
  (2,'Tunde Bakare','Data',    135000),
  (3,'Wei Chen','Data',        120000),
  (4,'Marta Silva','Data',      78000),
  (5,'Liam Byrne','Platform',  110000),
  (6,'Bisi Adeyemi','Platform',135000),
  (7,'Shola Oyelaran','Platform',88000),
  (8,'Kelvin Mensah','Analytics',92000),
  (9,'Amara Nwosu','Analytics', 92000);
`;

const YEARLY_FIXTURE = `
CREATE OR REPLACE TABLE monthly_sales (
  sold_on DATE, region VARCHAR, revenue DECIMAL(12,2)
);
INSERT INTO monthly_sales VALUES
  (DATE '2023-01-15','West',1000.00),(DATE '2023-02-11','West',1100.00),
  (DATE '2023-01-22','East', 800.00),(DATE '2023-02-05','East', 900.00),
  (DATE '2024-01-09','West',1250.00),(DATE '2024-02-18','West',1045.00),
  (DATE '2024-01-30','East', 720.00),(DATE '2024-02-14','East',1080.00);
`;

const FUNNEL_FIXTURE = `
CREATE OR REPLACE TABLE funnel_events (
  user_id INTEGER, step VARCHAR, occurred_at TIMESTAMP
);
INSERT INTO funnel_events VALUES
  (1,'visit',   TIMESTAMP '2024-05-01 09:00:00'),
  (1,'signup',  TIMESTAMP '2024-05-01 09:05:00'),
  (1,'purchase',TIMESTAMP '2024-05-01 09:20:00'),
  (2,'visit',   TIMESTAMP '2024-05-01 10:00:00'),
  (2,'signup',  TIMESTAMP '2024-05-01 10:07:00'),
  (3,'visit',   TIMESTAMP '2024-05-01 11:00:00'),
  (4,'visit',   TIMESTAMP '2024-05-02 08:00:00'),
  (4,'signup',  TIMESTAMP '2024-05-02 08:30:00'),
  (4,'purchase',TIMESTAMP '2024-05-02 09:00:00'),
  (5,'visit',   TIMESTAMP '2024-05-02 12:00:00');
`;

const ACTIVITY_FIXTURE = `
CREATE OR REPLACE TABLE logins (
  user_id INTEGER, login_on DATE
);
INSERT INTO logins VALUES
  (1,DATE '2024-05-01'),(1,DATE '2024-05-02'),(1,DATE '2024-05-03'),
  (1,DATE '2024-05-07'),(1,DATE '2024-05-08'),
  (2,DATE '2024-05-01'),(2,DATE '2024-05-03'),(2,DATE '2024-05-05'),
  (3,DATE '2024-05-04'),(3,DATE '2024-05-05'),(3,DATE '2024-05-06'),
  (3,DATE '2024-05-07');
`;

export const SQL_PROBLEMS: (SqlProblem | DbtProblem)[] = [
  {
    kind: "sql",
    slug: "select-and-filter",
    title: "Your first query: pick columns, not everything",
    category: "sql-fundamentals",
    difficulty: "easy",
    prompt: [
      "Start here if you haven't written much SQL. The `orders` table has `order_id`, `customer_id`, `ordered_on`, `status` and `amount`.",
      "`SELECT *` is fine while you're exploring, but a query that feeds a report should name its columns — so that adding a column upstream doesn't silently change what the report shows.",
      "Return just `order_id`, `ordered_on` and `amount` for orders over 100, newest first.",
    ],
    setup: ORDERS_FIXTURE,
    starter: "SELECT *\nFROM orders\n",
    solution: `SELECT order_id, ordered_on, amount
FROM orders
WHERE amount > 100
ORDER BY ordered_on DESC`,
    orderMatters: true,
    hint: "Replace the star with the three columns, filter with WHERE, then ORDER BY ordered_on DESC for newest first.",
  },
  {
    kind: "sql",
    slug: "count-and-distinct",
    title: "Counting rows and counting things",
    category: "sql-fundamentals",
    difficulty: "easy",
    prompt: [
      "Ten orders were placed, but not by ten different customers. Confusing those two numbers is the most common mistake in a first analytics job.",
      "Return one row with three columns: `orders` (how many rows are in `orders`), `customers` (how many distinct `customer_id` values appear) and `statuses` (how many distinct `status` values).",
    ],
    setup: ORDERS_FIXTURE,
    starter: "SELECT\n  COUNT(*) AS orders\n  -- two more counts\nFROM orders\n",
    solution: `SELECT
  COUNT(*) AS orders,
  COUNT(DISTINCT customer_id) AS customers,
  COUNT(DISTINCT status) AS statuses
FROM orders`,
    // One row out, so there is nothing to order.
    orderMatters: false,
    hint: "COUNT(*) counts rows; COUNT(DISTINCT col) counts unique values in a column.",
  },
  {
    kind: "sql",
    slug: "null-safe-filter",
    title: "The filter that quietly drops rows",
    category: "sql-fundamentals",
    difficulty: "easy",
    prompt: [
      "A colleague's query excludes cancelled orders with `WHERE status != 'cancelled'`, and the totals came out lower than the finance team expected.",
      "In SQL, comparing anything to NULL gives neither true nor false — it gives NULL, and a WHERE clause keeps only rows that are true. So any row with a NULL `status` disappears without a warning.",
      "Return `order_id` and `status` for every order that is not cancelled, including those with no status recorded. Order by `order_id`.",
    ],
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
  (106,'pending',120.00);
`,
    starter: "SELECT order_id, status\nFROM orders\nWHERE status != 'cancelled'\n",
    solution: `SELECT order_id, status
FROM orders
WHERE status IS DISTINCT FROM 'cancelled'
ORDER BY order_id`,
    orderMatters: true,
    hint: "Either add OR status IS NULL to the existing filter, or use IS DISTINCT FROM, which treats NULL as just another value.",
  },
  {
    kind: "sql",
    slug: "group-by-basics",
    title: "One row per group: find the repeat customers",
    category: "sql-fundamentals",
    difficulty: "easy",
    prompt: [
      "Most reporting questions are a GROUP BY in disguise: 'per customer', 'per month', 'per country' are all the same shape of query.",
      "Marketing wants the repeat customers — anyone who has placed more than one order.",
      "Return `customer_id` and `orders`, for customers with more than one order. Most orders first, and where two customers have the same count, order by `customer_id`.",
      "Note where the filter goes. WHERE filters rows before grouping; HAVING filters the groups afterwards. 'More than one order' is a fact about a group, so it needs HAVING.",
    ],
    setup: ORDERS_FIXTURE,
    starter: "SELECT customer_id, COUNT(*) AS orders\nFROM orders\nGROUP BY customer_id\n",
    solution: `SELECT customer_id, COUNT(*) AS orders
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY orders DESC, customer_id`,
    orderMatters: true,
    hint: "GROUP BY customer_id, then HAVING COUNT(*) > 1. The tie-break is a second expression in ORDER BY.",
  },
  {
    kind: "sql",
    slug: "active-nigerian-customers",
    title: "Active customers by country",
    category: "sql-fundamentals",
    difficulty: "easy",
    prompt: [
      "The `customers` table holds one row per customer, with an `is_active` flag and a two-letter `country` code.",
      "Return the `name` and `signed_up_on` of every active customer in Nigeria (`NG`), oldest signup first.",
    ],
    setup: ORDERS_FIXTURE,
    starter: "SELECT name, signed_up_on\nFROM customers\n-- your filter here\n",
    solution: `SELECT name, signed_up_on
FROM customers
WHERE is_active AND country = 'NG'
ORDER BY signed_up_on`,
    orderMatters: true,
  },
  {
    kind: "sql",
    slug: "orders-by-status",
    title: "Count orders by status",
    category: "sql-fundamentals",
    difficulty: "easy",
    prompt: [
      "Return each order `status` alongside how many orders have it, as `order_count`.",
      "Order by the count, largest first.",
    ],
    setup: ORDERS_FIXTURE,
    starter: "SELECT status, ...\nFROM orders\n",
    solution: `SELECT status, COUNT(*) AS order_count
FROM orders
GROUP BY status
ORDER BY order_count DESC`,
    orderMatters: true,
    hint: "COUNT(*) with GROUP BY, then ORDER BY the aggregate.",
  },
  {
    kind: "sql",
    slug: "revenue-per-customer",
    title: "Completed revenue per customer",
    category: "joins-aggregation",
    difficulty: "medium",
    prompt: [
      "Join `orders` to `customers` and return each customer's `name` with their total revenue as `total_revenue`.",
      "Only `completed` orders count — cancelled and pending ones must be excluded.",
      "Customers with no completed orders should not appear. Order by revenue, highest first.",
    ],
    setup: ORDERS_FIXTURE,
    starter: "SELECT c.name, ...\nFROM orders o\nJOIN customers c ON ...\n",
    solution: `SELECT c.name, SUM(o.amount) AS total_revenue
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.status = 'completed'
GROUP BY c.name
ORDER BY total_revenue DESC`,
    orderMatters: true,
  },
  {
    kind: "sql",
    slug: "customers-without-orders",
    title: "Customers who never ordered",
    category: "joins-aggregation",
    difficulty: "medium",
    prompt: [
      "Return the `name` of every customer who has never placed an order at all, alphabetically.",
      "This is the anti-join question, and it comes up in almost every SQL screen.",
    ],
    setup: ORDERS_FIXTURE,
    starter: "SELECT c.name\nFROM customers c\n",
    solution: `SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL
ORDER BY c.name`,
    orderMatters: true,
    hint: "LEFT JOIN then filter for NULL on the right-hand side — or use NOT EXISTS.",
  },
  {
    kind: "sql",
    slug: "monthly-revenue",
    title: "Revenue by month",
    category: "joins-aggregation",
    difficulty: "medium",
    prompt: [
      "Return one row per calendar month with the month as a date (`month`) and total completed revenue (`revenue`).",
      "Use the first day of the month as the date. Order chronologically.",
    ],
    setup: ORDERS_FIXTURE,
    starter: "SELECT ...\nFROM orders\nWHERE status = 'completed'\n",
    solution: `SELECT DATE_TRUNC('month', ordered_on) AS month, SUM(amount) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY 1
ORDER BY 1`,
    orderMatters: true,
    hint: "DATE_TRUNC('month', ...) gives you the first day of the month.",
  },
  {
    kind: "sql",
    slug: "running-total-revenue",
    title: "Running total of daily revenue",
    category: "window-functions",
    difficulty: "medium",
    prompt: [
      "`daily_revenue` has one row per day. Return `revenue_date`, `revenue`, and a cumulative `running_total` that grows across the week.",
      "Order by date.",
    ],
    setup: EVENTS_FIXTURE,
    starter:
      "SELECT revenue_date, revenue,\n       -- running total here\nFROM daily_revenue\nORDER BY revenue_date\n",
    solution: `SELECT revenue_date, revenue,
       SUM(revenue) OVER (ORDER BY revenue_date
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM daily_revenue
ORDER BY revenue_date`,
    orderMatters: true,
    hint: "SUM(...) OVER (ORDER BY ...) — the default frame already runs to the current row.",
  },
  {
    kind: "sql",
    slug: "day-over-day-change",
    title: "Day-over-day change with LAG",
    category: "window-functions",
    difficulty: "medium",
    prompt: [
      "Return `revenue_date`, `revenue`, and `change_from_yesterday` — the difference between that day's revenue and the previous day's.",
      "The first day has no previous day, so its change should be NULL. Order by date.",
    ],
    setup: EVENTS_FIXTURE,
    starter: "SELECT revenue_date, revenue,\n       -- LAG here\nFROM daily_revenue\n",
    solution: `SELECT revenue_date, revenue,
       revenue - LAG(revenue) OVER (ORDER BY revenue_date) AS change_from_yesterday
FROM daily_revenue
ORDER BY revenue_date`,
    orderMatters: true,
  },
  {
    kind: "sql",
    slug: "top-products-per-category",
    title: "Top 2 products in each category",
    category: "window-functions",
    difficulty: "hard",
    prompt: [
      "Return the two best-selling products in each category: `category`, `product`, `units_sold`.",
      "Order by category, then units sold descending.",
      "A plain GROUP BY cannot do this — you need to rank within each partition and then filter.",
    ],
    setup: PRODUCTS_FIXTURE,
    starter:
      "WITH ranked AS (\n  SELECT category, product, units_sold,\n         -- rank within category\n  FROM product_sales\n)\nSELECT category, product, units_sold\nFROM ranked\n",
    solution: `WITH ranked AS (
  SELECT category, product, units_sold,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC) AS rn
  FROM product_sales
)
SELECT category, product, units_sold
FROM ranked
WHERE rn <= 2
ORDER BY category, units_sold DESC`,
    orderMatters: true,
    hint: "ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC), filtered in an outer query.",
  },
  {
    kind: "sql",
    slug: "deduplicate-latest-record",
    title: "Keep only the latest row per key",
    category: "window-functions",
    difficulty: "hard",
    prompt: [
      "A raw landing table has picked up duplicates: the same `customer_id` appears several times, each with a different `loaded_at`.",
      "Return one row per customer — the most recently loaded one — with `customer_id`, `email` and `loaded_at`, ordered by customer id.",
      "This is the single most common task in an analytics engineer's day.",
    ],
    setup: `
CREATE OR REPLACE TABLE raw_customers (
  customer_id INTEGER, email VARCHAR, loaded_at TIMESTAMP
);
INSERT INTO raw_customers VALUES
  (1,'adaeze@old.com',TIMESTAMP '2024-05-01 09:00:00'),
  (1,'adaeze@new.com',TIMESTAMP '2024-05-04 11:30:00'),
  (2,'tunde@example.com',TIMESTAMP '2024-05-02 08:15:00'),
  (3,'marta@old.pt',TIMESTAMP '2024-05-01 10:00:00'),
  (3,'marta@mid.pt',TIMESTAMP '2024-05-03 10:00:00'),
  (3,'marta@new.pt',TIMESTAMP '2024-05-06 14:45:00'),
  (4,'wei@example.sg',TIMESTAMP '2024-05-05 16:20:00');
`,
    starter:
      "WITH ranked AS (\n  SELECT *,\n         -- number the rows per customer\n  FROM raw_customers\n)\nSELECT customer_id, email, loaded_at\nFROM ranked\n",
    solution: `WITH ranked AS (
  SELECT customer_id, email, loaded_at,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY loaded_at DESC) AS rn
  FROM raw_customers
)
SELECT customer_id, email, loaded_at
FROM ranked
WHERE rn = 1
ORDER BY customer_id`,
    orderMatters: true,
    hint: "Partition by the key, order by the timestamp descending, keep rn = 1.",
  },
  {
    kind: "sql",
    slug: "case-churned-revenue",
    title: "Case study: how much revenue churned",
    category: "metrics-logic",
    difficulty: "medium",
    prompt: [
      "You've joined a subscription business. The board asks a question nobody can answer from the dashboards: how much monthly revenue walked out of the door, and on which plan.",
      "`subscriptions` has one row per subscription, with `mrr`, `started_on` and a `cancelled_on` that is NULL while the subscription is live.",
      "Return `plan` and `churned_mrr` — the total `mrr` of cancelled subscriptions — for plans that lost anything at all. Largest loss first.",
    ],
    setup: SUBSCRIPTIONS_FIXTURE,
    starter: "SELECT plan, ...\nFROM subscriptions\n",
    solution: `SELECT plan, SUM(mrr) AS churned_mrr
FROM subscriptions
WHERE cancelled_on IS NOT NULL
GROUP BY plan
ORDER BY churned_mrr DESC`,
    orderMatters: true,
    hint: "A cancelled subscription is one where cancelled_on is not null — mind that NULL needs IS NOT NULL rather than <> NULL.",
  },
  {
    kind: "sql",
    slug: "case-survival-days",
    title: "Case study: how long before they leave",
    category: "metrics-logic",
    difficulty: "medium",
    prompt: [
      "The same business wants to know whether cheaper plans churn faster — the sales team believes they do, and wants to stop selling Starter.",
      "For cancelled subscriptions only, return `plan` and `avg_days` — the average number of days between `started_on` and `cancelled_on`, rounded to one decimal place.",
      "Order by `avg_days`, shortest life first.",
    ],
    setup: SUBSCRIPTIONS_FIXTURE,
    starter: "SELECT plan, ...\nFROM subscriptions\nWHERE cancelled_on IS NOT NULL\n",
    solution: `SELECT plan, ROUND(AVG(DATE_DIFF('day', started_on, cancelled_on)), 1) AS avg_days
FROM subscriptions
WHERE cancelled_on IS NOT NULL
GROUP BY plan
ORDER BY avg_days`,
    orderMatters: true,
    hint: "DATE_DIFF('day', start, end) gives the gap in days; average it per plan and round.",
  },
  {
    kind: "sql",
    slug: "case-monthly-cohorts",
    title: "Case study: signup cohorts",
    category: "metrics-logic",
    difficulty: "hard",
    prompt: [
      "Growth wants cohorts: for each month accounts signed up in, how many are still subscribed today.",
      "Return `cohort_month` (first day of the signup month), `signups`, and `retained` — how many of that cohort have no `cancelled_on`.",
      "Order chronologically.",
    ],
    setup: SUBSCRIPTIONS_FIXTURE,
    starter: "SELECT\n  DATE_TRUNC('month', started_on) AS cohort_month,\n  ...\nFROM subscriptions\n",
    solution: `SELECT
  DATE_TRUNC('month', started_on) AS cohort_month,
  COUNT(*) AS signups,
  COUNT(*) FILTER (WHERE cancelled_on IS NULL) AS retained
FROM subscriptions
GROUP BY 1
ORDER BY 1`,
    orderMatters: true,
    hint: "COUNT(*) FILTER (WHERE ...) counts a subset without a second query — or SUM a CASE expression if you prefer.",
  },
  {
    kind: "sql",
    slug: "case-sessionise-events",
    title: "Case study: turn events into sessions",
    category: "metrics-logic",
    difficulty: "hard",
    prompt: [
      "Product wants session counts, and all you have is `usage_events` — one row per action, with `account_id` and `occurred_at`.",
      "A session ends after 30 minutes of inactivity: two events more than 30 minutes apart belong to different sessions.",
      "Return `account_id` and `sessions` — how many distinct sessions each account had — ordered by `account_id`.",
      "This is the classic sessionisation question, and it comes up constantly for product data roles.",
    ],
    setup: SUBSCRIPTIONS_FIXTURE,
    starter: `WITH gaps AS (
  SELECT
    account_id,
    occurred_at,
    -- how long since this account's previous event?
  FROM usage_events
)
SELECT account_id, ...
`,
    solution: `WITH gaps AS (
  SELECT
    account_id,
    occurred_at,
    LAG(occurred_at) OVER (PARTITION BY account_id ORDER BY occurred_at) AS previous_at
  FROM usage_events
)
SELECT
  account_id,
  SUM(CASE WHEN previous_at IS NULL
            OR DATE_DIFF('minute', previous_at, occurred_at) > 30
           THEN 1 ELSE 0 END) AS sessions
FROM gaps
GROUP BY account_id
ORDER BY account_id`,
    orderMatters: true,
    hint: "LAG gives the previous event time per account. Every row whose gap exceeds 30 minutes — plus the first — starts a new session, so count those.",
  },
  {
    kind: "sql",
    slug: "second-highest-salary",
    title: "The second highest, with ties",
    category: "window-functions",
    difficulty: "medium",
    prompt: [
      "The most asked SQL interview question there is, and the version people get wrong is the one with ties.",
      "Return the second highest distinct `salary` in `employees`, as a single column named `salary`.",
      "Two people share the top salary. The second highest is the next distinct amount below it — so `ORDER BY salary DESC LIMIT 1 OFFSET 1` returns the top salary again, which is the mistake this question exists to catch.",
    ],
    setup: SALARIES_FIXTURE,
    starter: "SELECT ...\nFROM employees\n",
    solution: `SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1`,
    orderMatters: false,
    hint: "DISTINCT before the ordering collapses the tie, so the offset counts distinct amounts. DENSE_RANK() = 2 works just as well and generalises to the Nth.",
  },
  {
    kind: "sql",
    slug: "percent-of-total",
    title: "Share of the total",
    category: "window-functions",
    difficulty: "medium",
    prompt: [
      "Every 'what percentage of revenue' question is this shape: a value, and the total it belongs to, on the same row.",
      "Return `department`, `headcount`, `payroll` (the department's total salary) and `pct_of_payroll` — its share of the whole company's payroll, as a percentage rounded to one decimal place.",
      "Order by `pct_of_payroll` descending.",
      "The trick is getting the grand total alongside a grouped row without a self-join: a window function over the aggregate does it in one pass.",
    ],
    setup: SALARIES_FIXTURE,
    starter: `SELECT
  department,
  COUNT(*) AS headcount,
  SUM(salary) AS payroll
  -- the share
FROM employees
GROUP BY department
`,
    solution: `SELECT
  department,
  COUNT(*) AS headcount,
  SUM(salary) AS payroll,
  ROUND(SUM(salary) * 100.0 / SUM(SUM(salary)) OVER (), 1) AS pct_of_payroll
FROM employees
GROUP BY department
ORDER BY pct_of_payroll DESC`,
    orderMatters: true,
    hint: "SUM(SUM(salary)) OVER () looks strange but is right: the inner SUM aggregates the group, the window then totals those group values.",
  },
  {
    kind: "sql",
    slug: "year-over-year-growth",
    title: "Year over year, by region",
    category: "metrics-logic",
    difficulty: "hard",
    prompt: [
      "Leadership wants growth, not revenue — the same month last year compared with this one.",
      "Return `year`, `month`, `region`, `revenue`, and `yoy_pct`: the change from the same month of the previous year, as a percentage rounded to one decimal place.",
      "Months with no prior year to compare against get NULL. Order by `region`, then `year`, then `month`.",
      "The subtlety is the partition: comparing to the previous row would compare January to the December before it. You want the previous row *for the same month and region*.",
    ],
    setup: YEARLY_FIXTURE,
    starter: `WITH monthly AS (
  SELECT
    YEAR(sold_on) AS year,
    MONTH(sold_on) AS month,
    region,
    SUM(revenue) AS revenue
  FROM monthly_sales
  GROUP BY 1, 2, 3
)
SELECT ...
`,
    solution: `WITH monthly AS (
  SELECT
    YEAR(sold_on) AS year,
    MONTH(sold_on) AS month,
    region,
    SUM(revenue) AS revenue
  FROM monthly_sales
  GROUP BY 1, 2, 3
)
SELECT
  year,
  month,
  region,
  revenue,
  ROUND(
    (revenue - LAG(revenue) OVER (PARTITION BY region, month ORDER BY year))
      * 100.0
      / LAG(revenue) OVER (PARTITION BY region, month ORDER BY year),
    1
  ) AS yoy_pct
FROM monthly
ORDER BY region, year, month`,
    orderMatters: true,
    hint: "PARTITION BY region, month ORDER BY year — then LAG reaches the same month a year earlier rather than last month.",
  },
  {
    kind: "sql",
    slug: "longest-streak",
    title: "The longest run of consecutive days",
    category: "metrics-logic",
    difficulty: "hard",
    prompt: [
      "Streaks are the classic gaps-and-islands problem, and the technique behind them turns up everywhere — consecutive days, contiguous ranges, unbroken periods of a status.",
      "`logins` has one row per user per day they logged in. Return `user_id` and `longest_streak`, the most consecutive days each user appeared, ordered by `user_id`.",
      "The trick: number each user's days, then subtract that number from the date. Consecutive days shift by the same amount, so every run shares one value you can group on. Days with a gap land on a different one.",
    ],
    setup: ACTIVITY_FIXTURE,
    starter: `WITH numbered AS (
  SELECT
    user_id,
    login_on,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_on) AS n
  FROM logins
)
SELECT ...
`,
    solution: `WITH numbered AS (
  SELECT
    user_id,
    login_on,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_on) AS n
  FROM logins
),
islands AS (
  -- ROW_NUMBER() is a BIGINT and DuckDB will not subtract one from a DATE,
  -- so the cast is required rather than cosmetic.
  SELECT user_id, login_on - CAST(n AS INTEGER) AS grp
  FROM numbered
),
runs AS (
  SELECT user_id, grp, COUNT(*) AS streak
  FROM islands
  GROUP BY user_id, grp
)
SELECT user_id, MAX(streak) AS longest_streak
FROM runs
GROUP BY user_id
ORDER BY user_id`,
    orderMatters: true,
    hint: "login_on minus the row number is constant within a run of consecutive days — cast the row number to INTEGER first, since DuckDB will not subtract a BIGINT from a DATE. Group on it, count each run, then take the largest per user.",
  },
  {
    kind: "sql",
    slug: "funnel-conversion",
    title: "Where the funnel leaks",
    category: "metrics-logic",
    difficulty: "medium",
    prompt: [
      "Growth wants the funnel: visit, then signup, then purchase, and the conversion rate at each step.",
      "`funnel_events` has one row per user per step reached.",
      "Return `step`, `users` (how many reached it) and `pct_of_visits` — that count as a percentage of the users who visited, rounded to one decimal place. Order by `users` descending.",
      "Every funnel question is really about the denominator. Dividing each step by the one before gives step-to-step conversion; dividing by the top gives overall. Say which you mean, because they tell different stories.",
    ],
    setup: FUNNEL_FIXTURE,
    starter: "SELECT step, COUNT(DISTINCT user_id) AS users\nFROM funnel_events\nGROUP BY step\n",
    solution: `SELECT
  step,
  COUNT(DISTINCT user_id) AS users,
  ROUND(
    COUNT(DISTINCT user_id) * 100.0
      / MAX(COUNT(DISTINCT user_id)) OVER (),
    1
  ) AS pct_of_visits
FROM funnel_events
GROUP BY step
ORDER BY users DESC`,
    orderMatters: true,
    hint: "Visits are the largest step, so MAX(...) OVER () across the grouped counts gives the denominator without a second query.",
  },
  {
    kind: "sql",
    slug: "fan-out-join",
    title: "The revenue report is double-counting",
    category: "pipeline-etl",
    difficulty: "hard",
    prompt: [
      "Finance says total revenue in the dashboard is far too high. The model joins `orders` to `order_items` to pick up the product category, then sums `orders.amount`.",
      "Because an order has many items, the join fans out: a 3-item order contributes its full amount three times.",
      "Return the correct total revenue per customer as `customer_id` and `total_revenue`, ordered by customer id. Each order must be counted exactly once.",
    ],
    setup: `
CREATE OR REPLACE TABLE orders (
  order_id INTEGER, customer_id INTEGER, amount DECIMAL(10,2)
);
INSERT INTO orders VALUES
  (101,1,150.00),(102,1,90.00),(103,2,300.00),(104,3,45.00);

CREATE OR REPLACE TABLE order_items (
  order_id INTEGER, sku VARCHAR, category VARCHAR
);
INSERT INTO order_items VALUES
  (101,'SKU-1','Hardware'),(101,'SKU-2','Software'),(101,'SKU-3','Hardware'),
  (102,'SKU-4','Software'),
  (103,'SKU-5','Hardware'),(103,'SKU-6','Hardware'),
  (104,'SKU-7','Services');
`,
    starter: `-- The broken version, for reference:
-- SELECT o.customer_id, SUM(o.amount) AS total_revenue
-- FROM orders o
-- JOIN order_items i ON i.order_id = o.order_id
-- GROUP BY o.customer_id;

SELECT customer_id, ...
FROM orders
`,
    solution: `SELECT customer_id, SUM(amount) AS total_revenue
FROM orders
GROUP BY customer_id
ORDER BY customer_id`,
    orderMatters: true,
    hint: "The join adds nothing the answer needs. Aggregate at the grain of the fact table you're measuring.",
  },
  {
    kind: "sql",
    slug: "late-arriving-data",
    title: "The incremental load is dropping rows",
    category: "pipeline-etl",
    difficulty: "hard",
    prompt: [
      "An incremental model filters on `event_date > (SELECT MAX(event_date) FROM target)`, which looks right but silently loses data.",
      "Events arrive late: a row with `event_date` of 2024-05-02 can land in the warehouse on 2024-05-05, by which time the watermark has already moved past it.",
      "Using `loaded_at` rather than `event_date` as the watermark, return every event loaded after 2024-05-03, as `event_id`, `event_date`, `loaded_at`, ordered by `event_id`.",
    ],
    setup: `
CREATE OR REPLACE TABLE raw_events (
  event_id INTEGER, event_date DATE, loaded_at TIMESTAMP
);
INSERT INTO raw_events VALUES
  (1,DATE '2024-05-01',TIMESTAMP '2024-05-01 23:10:00'),
  (2,DATE '2024-05-02',TIMESTAMP '2024-05-02 23:10:00'),
  (3,DATE '2024-05-03',TIMESTAMP '2024-05-03 23:10:00'),
  (4,DATE '2024-05-02',TIMESTAMP '2024-05-05 06:00:00'),
  (5,DATE '2024-05-04',TIMESTAMP '2024-05-04 22:45:00'),
  (6,DATE '2024-05-01',TIMESTAMP '2024-05-06 07:30:00');
`,
    starter: "SELECT event_id, event_date, loaded_at\nFROM raw_events\n-- watermark on the right column\n",
    solution: `SELECT event_id, event_date, loaded_at
FROM raw_events
WHERE loaded_at > TIMESTAMP '2024-05-03 23:59:59'
ORDER BY event_id`,
    orderMatters: true,
    hint: "Events 4 and 6 are the late arrivals — an event_date watermark would have skipped them entirely.",
  },
  {
    kind: "sql",
    slug: "scd2-current-row",
    title: "Pick the current row from an SCD2 dimension",
    category: "dimensional-modelling",
    difficulty: "medium",
    prompt: [
      "`dim_customer` is a type-2 slowly changing dimension: each customer has several versions, each with `valid_from` and `valid_to`, and the current version has `valid_to` set to NULL.",
      "A downstream model joined without filtering and multiplied every customer by their version count.",
      "Return only the current version of each customer: `customer_id`, `tier`, `valid_from`, ordered by customer id.",
    ],
    setup: `
CREATE OR REPLACE TABLE dim_customer (
  customer_id INTEGER, tier VARCHAR, valid_from DATE, valid_to DATE
);
INSERT INTO dim_customer VALUES
  (1,'bronze',DATE '2023-01-01',DATE '2023-07-01'),
  (1,'silver',DATE '2023-07-01',DATE '2024-02-01'),
  (1,'gold',  DATE '2024-02-01',NULL),
  (2,'bronze',DATE '2023-05-12',NULL),
  (3,'silver',DATE '2023-03-04',DATE '2024-01-09'),
  (3,'bronze',DATE '2024-01-09',NULL);
`,
    starter: "SELECT customer_id, tier, valid_from\nFROM dim_customer\n",
    solution: `SELECT customer_id, tier, valid_from
FROM dim_customer
WHERE valid_to IS NULL
ORDER BY customer_id`,
    orderMatters: true,
    hint: "The open-ended row is the current one. Mind that NULL needs IS NULL, not = NULL.",
  },
];
