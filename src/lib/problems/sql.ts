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

export const SQL_PROBLEMS: (SqlProblem | DbtProblem)[] = [
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
    slug: "fan-out-join",
    title: "The revenue report is double-counting",
    category: "pipeline-debugging",
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
    category: "pipeline-debugging",
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
    category: "pipeline-debugging",
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
