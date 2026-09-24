#!/usr/bin/env node
/**
 * Verifies the PHP API on go54 is reachable, correctly configured, and sharing
 * the same secret as this app.
 *
 * Usage, from the prep/ directory:
 *
 *   PREP_API_URL=https://behindthedata.tech/api \
 *   API_SHARED_SECRET=your-secret \
 *   node scripts/check-api.mjs
 *
 * It reads .env.local automatically if those variables aren't already set.
 */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key && !process.env[key]) {
        process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — rely on the shell environment.
  }
}

loadEnvLocal();

const BASE = process.env.PREP_API_URL;
const SECRET = process.env.API_SHARED_SECRET;

if (!BASE || !SECRET) {
  console.error(
    "Set PREP_API_URL and API_SHARED_SECRET (in .env.local or the environment).",
  );
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000).toString();
const path = "health";
const signature = createHmac("sha256", SECRET)
  .update(`${timestamp}.GET.${path}.`)
  .digest("hex");

console.log(`Checking ${BASE}/${path} …\n`);

let response;
try {
  response = await fetch(`${BASE}/${path}`, {
    headers: {
      "X-Prep-Timestamp": timestamp,
      "X-Prep-Signature": signature,
    },
  });
} catch (error) {
  console.error("✗ Could not reach the API at all.");
  console.error(`  ${error.message}`);
  console.error("\n  Check PREP_API_URL points at the folder holding index.php.");
  process.exit(1);
}

const text = await response.text();
let payload;
try {
  payload = JSON.parse(text);
} catch {
  console.error(`✗ The API returned HTML rather than JSON (HTTP ${response.status}).`);
  console.error("  Usually this means .htaccess isn't routing to index.php,");
  console.error("  or PREP_API_URL is pointing at the wrong folder.\n");
  console.error(text.slice(0, 400));
  process.exit(1);
}

if (response.status === 401) {
  console.error(`✗ ${payload.error}`);
  console.error(
    "\n  API_SHARED_SECRET here does not match the one in api/.env on go54,",
  );
  console.error("  or the server clock is more than 5 minutes out.");
  process.exit(1);
}

if (!response.ok) {
  console.error(`✗ HTTP ${response.status}: ${payload.error ?? text}`);
  process.exit(1);
}

console.log(`  PHP version   ${payload.php}`);
console.log(`  Database      ${payload.database}`);

if (payload.databaseError) {
  console.error(`\n✗ Database error: ${payload.databaseError}`);
  console.error("  Check DB_NAME, DB_USER and DB_PASS in api/.env.");
  process.exit(1);
}

if (payload.missingTables?.length) {
  console.error(`\n✗ Missing tables: ${payload.missingTables.join(", ")}`);
  console.error("  Import db/schema.sql through phpMyAdmin.");
  process.exit(1);
}

console.log("\n✓ Everything is wired up correctly.");
