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
];
