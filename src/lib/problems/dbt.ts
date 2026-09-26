/**
 * dbt modelling problems.
 *
 * These are genuinely executed rather than eyeballed. The model you write goes
 * through a small compile step — `{{ config(...) }}` is stripped, and
 * `{{ ref('x') }}` / `{{ source('a','x') }}` resolve to the fixture tables —
 * and the resulting SQL runs on DuckDB, exactly like the plain SQL problems.
 *
 * That is worth the small amount of machinery: a dbt question marked by
 * pattern-matching teaches you to write what the checker wants, whereas one
 * that actually runs teaches you to write a model that works.
 */

import type { DbtProblem } from "./types";

/**
 * Resolves the Jinja a dbt model uses into plain SQL.
 *
 * Only the three constructs these problems need. This is not a Jinja engine
 * and is not trying to be — anything beyond ref, source and config is left
 * alone so it fails loudly rather than silently producing something else.
 */
export function compileDbt(sql: string): string {
  return (
    sql
      // {{ config(...) }} affects materialisation, which has no meaning here.
      .replace(/\{\{-?\s*config\([\s\S]*?\)\s*-?\}\}/g, "")
      .replace(/\{\{-?\s*ref\(\s*['"]([^'"]+)['"]\s*\)\s*-?\}\}/g, "$1")
      .replace(
        /\{\{-?\s*source\(\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]\s*\)\s*-?\}\}/g,
        "$1",
      )
      .trim()
  );
}

const ORDERS_FIXTURE = `
CREATE OR REPLACE TABLE stg_orders (
  order_id INTEGER, customer_id INTEGER, ordered_at TIMESTAMP,
  status VARCHAR, amount DECIMAL(10,2)
);
INSERT INTO stg_orders VALUES
  (101,1,TIMESTAMP '2024-03-01 09:12:00','completed',150.00),
  (102,1,TIMESTAMP '2024-03-18 14:40:00','completed',89.50),
  (103,2,TIMESTAMP '2024-03-05 11:05:00','cancelled',220.00),
  (104,2,TIMESTAMP '2024-04-09 16:22:00','completed',310.25),
  (105,3,TIMESTAMP '2024-04-15 08:55:00','completed',75.00),
  (106,3,TIMESTAMP '2024-05-02 19:30:00','pending',120.00),
  (107,1,TIMESTAMP '2024-05-11 10:02:00','completed',45.75);

CREATE OR REPLACE TABLE stg_customers (
  customer_id INTEGER, full_name VARCHAR, country VARCHAR, signed_up_at TIMESTAMP
);
INSERT INTO stg_customers VALUES
  (1,'Adaeze Okafor','NG',TIMESTAMP '2024-01-15 10:00:00'),
  (2,'Tunde Bakare','NG',TIMESTAMP '2024-02-03 10:00:00'),
  (3,'Wei Chen','SG',TIMESTAMP '2024-03-11 10:00:00'),
  (4,'Marta Silva','PT',TIMESTAMP '2024-04-02 10:00:00');
`;


/* A subscription business, carried across the modelling case studies so the
   scenario builds rather than resetting at every question. */
const BILLING_FIXTURE = `
CREATE OR REPLACE TABLE stg_subscriptions (
  subscription_id INTEGER, account_id INTEGER, plan VARCHAR,
  started_on DATE, cancelled_on DATE, mrr DECIMAL(10,2)
);
INSERT INTO stg_subscriptions VALUES
  (1,10,'starter',DATE '2024-01-05',DATE '2024-05-31',29.00),
  (2,11,'growth', DATE '2024-01-18',DATE '2024-04-02',99.00),
  (3,12,'starter',DATE '2024-02-02',DATE '2024-02-27',29.00),
  (4,13,'scale',  DATE '2024-02-14',NULL,299.00),
  (5,14,'growth', DATE '2024-03-01',NULL,99.00),
  (6,10,'growth', DATE '2024-06-01',NULL,99.00);

CREATE OR REPLACE TABLE stg_accounts (
  account_id INTEGER, company VARCHAR, segment VARCHAR, country VARCHAR
);
INSERT INTO stg_accounts VALUES
  (10,'Oyelaran Foods','smb','NG'),
  (11,'Bakare Logistics','smb','NG'),
  (12,'Chen Retail','smb','SG'),
  (13,'Silva Industries','enterprise','PT'),
  (14,'Adeyemi Health','mid','NG');

CREATE OR REPLACE TABLE raw_plan_history (
  account_id INTEGER, plan VARCHAR, valid_from DATE, loaded_at TIMESTAMP
);
INSERT INTO raw_plan_history VALUES
  (10,'starter',DATE '2024-01-05',TIMESTAMP '2024-01-05 02:00:00'),
  (10,'growth', DATE '2024-06-01',TIMESTAMP '2024-06-01 02:00:00'),
  (11,'growth', DATE '2024-01-18',TIMESTAMP '2024-01-18 02:00:00'),
  (13,'growth', DATE '2024-02-14',TIMESTAMP '2024-02-14 02:00:00'),
  (13,'scale',  DATE '2024-04-01',TIMESTAMP '2024-04-01 02:00:00');
`;

export const DBT_PROBLEMS: DbtProblem[] = [
  {
    kind: "dbt",
    slug: "dbt-customer-orders-mart",
    title: "Build a customer orders mart",
    category: "dbt-modelling",
    difficulty: "medium",
    refs: { stg_orders: "stg_orders", stg_customers: "stg_customers" },
    prompt: [
      "Write `fct_customer_orders`, a mart with one row per customer.",
      "Reference the staging models with `{{ ref('stg_customers') }}` and `{{ ref('stg_orders') }}` rather than the raw table names — that is what makes dbt build them in the right order.",
      "Return `customer_id`, `full_name`, `orders` (completed orders only) and `revenue` (their total). Include every customer, even those with no completed orders — show 0 and 0 for them. Order by `customer_id`.",
    ],
    setup: ORDERS_FIXTURE,
    starter: `{{ config(materialized='table') }}

select
    c.customer_id,
    c.full_name
    -- count and sum here
from {{ ref('stg_customers') }} c
-- join the orders
`,
    solution: `select
    c.customer_id,
    c.full_name,
    count(o.order_id) as orders,
    coalesce(sum(o.amount), 0) as revenue
from stg_customers c
left join stg_orders o
  on o.customer_id = c.customer_id
 and o.status = 'completed'
group by c.customer_id, c.full_name
order by c.customer_id`,
    orderMatters: true,
    hint: "A LEFT JOIN keeps customers with no orders — but the status filter has to sit in the ON clause, not the WHERE, or it turns the outer join back into an inner one.",
  },
  {
    kind: "dbt",
    slug: "dbt-incremental-filter",
    title: "Make a model incremental",
    category: "dbt-modelling",
    difficulty: "hard",
    refs: { stg_orders: "stg_orders" },
    prompt: [
      "`fct_orders` currently rebuilds from scratch every run. Turn it into an incremental model.",
      "Return `order_id`, `customer_id`, `ordered_at` and `amount` for completed orders, ordered by `order_id`.",
      "On an incremental run it should process only rows newer than what's already there. Use the `is_incremental()` guard around that filter.",
      "The checker compiles your model as a full refresh, so the guarded branch won't run here — but the guard has to be present and correctly placed, exactly as it would be in a real project.",
    ],
    setup: ORDERS_FIXTURE,
    starter: `{{ config(materialized='incremental', unique_key='order_id') }}

select
    order_id,
    customer_id,
    ordered_at,
    amount
from {{ ref('stg_orders') }}
where status = 'completed'

-- add the incremental guard
`,
    solution: `select
    order_id,
    customer_id,
    ordered_at,
    amount
from stg_orders
where status = 'completed'
order by order_id`,
    orderMatters: true,
    hint: "{% if is_incremental() %} ... {% endif %} wraps a predicate comparing ordered_at against max(ordered_at) from {{ this }}.",
  },
  {
    kind: "dbt",
    slug: "dbt-dedupe-staging",
    title: "Deduplicate a staging model",
    category: "dbt-modelling",
    difficulty: "medium",
    refs: { raw_customers: "raw_customers" },
    prompt: [
      "The raw customer feed re-sends rows, so `raw_customers` has the same `customer_id` several times with different `loaded_at` values.",
      "Write `stg_customers` returning one row per customer — the most recently loaded — with `customer_id`, `email` and `loaded_at`, ordered by `customer_id`.",
      "Reference the source with `{{ source('raw', 'raw_customers') }}`.",
    ],
    setup: `
CREATE OR REPLACE TABLE raw_customers (
  customer_id INTEGER, email VARCHAR, loaded_at TIMESTAMP
);
INSERT INTO raw_customers VALUES
  (1,'adaeze@old.com',TIMESTAMP '2024-05-01 09:00:00'),
  (1,'adaeze@new.com',TIMESTAMP '2024-05-04 11:30:00'),
  (2,'tunde@example.com',TIMESTAMP '2024-05-02 08:15:00'),
  (3,'wei@old.sg',TIMESTAMP '2024-05-01 10:00:00'),
  (3,'wei@new.sg',TIMESTAMP '2024-05-06 14:45:00');
`,
    starter: `with ranked as (
    select
        *,
        -- number the rows per customer
    from {{ source('raw', 'raw_customers') }}
)

select customer_id, email, loaded_at
from ranked
`,
    solution: `with ranked as (
    select
        customer_id, email, loaded_at,
        row_number() over (partition by customer_id order by loaded_at desc) as rn
    from raw_customers
)
select customer_id, email, loaded_at
from ranked
where rn = 1
order by customer_id`,
    orderMatters: true,
    hint: "row_number() over (partition by the key order by the timestamp desc), then keep rn = 1.",
  },
  {
    kind: "dbt",
    slug: "dbt-case-account-summary",
    title: "Case study: the account table everyone keeps rebuilding",
    category: "dbt-modelling",
    difficulty: "medium",
    refs: { stg_subscriptions: "stg_subscriptions", stg_accounts: "stg_accounts" },
    prompt: [
      "Three analysts have each written their own version of 'active revenue per account', and the three numbers disagree. You've been asked to settle it with one model everybody uses.",
      "Write `dim_accounts`: one row per account, with `account_id`, `company`, `segment`, `active_subscriptions` and `active_mrr`.",
      "Active means `cancelled_on` is null. Accounts with nothing active still belong in the table — a dimension that drops rows is how the disagreement started. Show 0 for them.",
      "Order by `account_id`.",
    ],
    setup: BILLING_FIXTURE,
    starter: `{{ config(materialized='table') }}

select
    a.account_id,
    a.company,
    a.segment
    -- the two measures
from {{ ref('stg_accounts') }} a
-- join the subscriptions
`,
    solution: `select
    a.account_id,
    a.company,
    a.segment,
    count(s.subscription_id) as active_subscriptions,
    coalesce(sum(s.mrr), 0) as active_mrr
from stg_accounts a
left join stg_subscriptions s
  on s.account_id = a.account_id
 and s.cancelled_on is null
group by a.account_id, a.company, a.segment
order by a.account_id`,
    orderMatters: true,
    hint: "The active test belongs in the ON clause. Put it in WHERE and the left join collapses to an inner one, which is exactly the bug that made the three numbers differ.",
  },
  {
    kind: "dbt",
    slug: "dbt-case-plan-scd2",
    title: "Case study: track how plans changed over time",
    category: "dbt-modelling",
    difficulty: "hard",
    prompt: [
      "Sales wants to know what plan an account was on when a given deal closed. Today the warehouse only holds the current plan, so every historical question is unanswerable.",
      "`raw_plan_history` has one row per plan change, with `account_id`, `plan` and `valid_from`.",
      "Write `dim_account_plans` as a type 2 dimension: `account_id`, `plan`, `valid_from`, `valid_to` and `is_current`.",
      "`valid_to` is the day before the next change for that account, and null for the current row. `is_current` is true for the latest row per account.",
      "Order by `account_id`, then `valid_from`. This is the single most common modelling question asked of analytics engineers, so it is worth being fluent in.",
    ],
    refs: { raw_plan_history: "raw_plan_history" },
    setup: BILLING_FIXTURE,
    starter: `with changes as (
    select
        account_id,
        plan,
        valid_from,
        -- when does the next version start?
    from {{ source('raw', 'raw_plan_history') }}
)

select
    account_id,
    plan,
    valid_from
    -- valid_to and is_current
from changes
`,
    solution: `with changes as (
    select
        account_id,
        plan,
        valid_from,
        lead(valid_from) over (partition by account_id order by valid_from) as next_from
    from raw_plan_history
)
select
    account_id,
    plan,
    valid_from,
    case when next_from is null then null else next_from - 1 end as valid_to,
    next_from is null as is_current
from changes
order by account_id, valid_from`,
    orderMatters: true,
    hint: "LEAD gives the next valid_from per account. Subtract a day from it for valid_to, and a null LEAD marks the current row.",
  },
  {
    kind: "dbt",
    slug: "dbt-case-monthly-revenue-grain",
    title: "Case study: revenue by month, not by subscription",
    category: "dbt-modelling",
    difficulty: "hard",
    prompt: [
      "Finance wants a monthly revenue table. The subscriptions model has one row per subscription with a start and an end, which is the wrong grain — nobody can chart it.",
      "Write `fct_monthly_revenue` at one row per `month` per `plan`, covering January to June 2024, with `month` (first day of the month), `plan` and `mrr` — the total `mrr` of subscriptions live at any point in that month.",
      "A subscription is live in a month if it started on or before the month's end and had not cancelled before the month's start.",
      "Order by `month`, then `plan`. Reshaping a row-per-entity table into a row-per-period table is the everyday work of a modelling role.",
    ],
    refs: { stg_subscriptions: "stg_subscriptions" },
    setup: BILLING_FIXTURE,
    starter: `with months as (
    -- generate the six month starts as one row each
    select null as month
)

select
    m.month,
    s.plan
    -- the measure
from months m
-- join the subscriptions on an overlap, not an equality
`,
    solution: `with months as (
    select unnest(generate_series(date '2024-01-01', date '2024-06-01', interval 1 month))::date as month
)
select
    m.month,
    s.plan,
    sum(s.mrr) as mrr
from months m
join stg_subscriptions s
  on s.started_on <= (m.month + interval 1 month - interval 1 day)
 and (s.cancelled_on is null or s.cancelled_on >= m.month)
group by m.month, s.plan
order by m.month, s.plan`,
    orderMatters: true,
    hint: "Build a month spine first with generate_series, then join subscriptions to it on an overlap condition rather than on equality.",
  },
];
