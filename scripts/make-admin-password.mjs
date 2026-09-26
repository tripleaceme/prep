#!/usr/bin/env node
/**
 * Generates the ANALYTICS_PASSWORD_HASH value for /analytics.
 *
 * You probably don't need this. /analytics normally authenticates against a
 * registered Prep account carrying the is_admin flag — see DEPLOY.md B3.
 *
 * What this produces is the break-glass path: credentials held only in
 * Vercel's environment, checked after the database has already refused. Set it
 * up if you want a way in when the database is unreachable, which is exactly
 * when you most want the operator tools.
 *
 * The plaintext password is never stored anywhere — not in this repo, not in
 * the database, not in Vercel. Only this hash goes into the environment.
 *
 * Usage, from the prep/ directory:
 *
 *   node scripts/make-admin-password.mjs 'your-password-here'
 *
 * Wrap the password in single quotes so the shell doesn't eat $ or !.
 */

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/make-admin-password.mjs 'your-password'");
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    "Use at least 12 characters. This is the only thing standing between\n" +
      "the internet and every user's email address.",
  );
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, 64);
const hash = `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;

console.log("\nAdd these to Vercel → Settings → Environment Variables:\n");
console.log("  ANALYTICS_USERNAME=<whatever username you want>");
console.log(`  ANALYTICS_PASSWORD_HASH=${hash}\n`);
console.log("Then sign in at https://prep.behindthedata.tech/analytics\n");
console.log(
  "Your shell history now contains the password in plain text.\n" +
    "Clear it with:  history -d $(history 1)\n",
);
