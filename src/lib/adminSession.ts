import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ApiError, callApi } from "@/lib/api";

/**
 * Operator login for /analytics.
 *
 * Credentials are an ordinary Prep account carrying the `is_admin` flag, so
 * signing in here uses the same email and password as the app — and password
 * reset, verification and rate limiting all apply without being rebuilt.
 *
 * What stays separate is the session. Analytics issues its own cookie with its
 * own JWT audience, and the app never issues a token with that audience, so a
 * stolen user session cannot be replayed as an operator one. Holding the admin
 * password is the only way in.
 *
 * ANALYTICS_USERNAME and ANALYTICS_PASSWORD_HASH still work when both are set.
 * They are the way back in if the database is unreachable — which is exactly
 * when you most want to look at the operator tools.
 */

const COOKIE = "prep_admin";
const AUDIENCE = "prep-admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // short: this is an operator tool

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(value);
}

/** Produces the `scrypt$salt$hash` string stored in ANALYTICS_PASSWORD_HASH. */
export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const derived = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);

  // Constant time, so a wrong password leaks nothing through response timing.
  return timingSafeEqual(derived, expected);
}

/**
 * The break-glass path: credentials held only in Vercel's environment.
 *
 * Returns false when either variable is unset, which is the normal case.
 */
async function checkEnvCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUser = process.env.ANALYTICS_USERNAME;
  const expectedHash = process.env.ANALYTICS_PASSWORD_HASH;

  if (!expectedUser || !expectedHash) return false;

  // Always run the hash, even on a username miss, so timing doesn't reveal
  // whether the username was right.
  const passwordOk = await verifyPassword(password, expectedHash);

  const userBuffer = Buffer.from(username);
  const expectedBuffer = Buffer.from(expectedUser);
  const usernameOk =
    userBuffer.length === expectedBuffer.length &&
    timingSafeEqual(userBuffer, expectedBuffer);

  return usernameOk && passwordOk;
}

export async function checkAdminCredentials(
  identifier: string,
  password: string,
): Promise<boolean> {
  // The database is asked first, because that is the route an operator
  // normally uses and the environment variables are usually absent.
  // Addresses are stored lowercase, so the lookup folds case; the env
  // comparison below deliberately does not.
  try {
    await callApi<{ admin: { id: string } }>("auth/admin-login", {
      method: "POST",
      body: { email: identifier.toLowerCase(), password },
    });
    return true;
  } catch (err) {
    // A 401 is a wrong password or an account without the flag, and is the
    // expected outcome of a failed attempt. Anything else — the API being
    // down, a signature mismatch — is worth a log line, because otherwise a
    // misconfigured deployment is indistinguishable from a typo.
    if (!(err instanceof ApiError) || err.status !== 401) {
      console.error("[analytics] admin login could not reach the API:", err);
    }
  }

  return checkEnvCredentials(identifier, password);
}

export async function createAdminSession(username: string): Promise<void> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readAdminSession(): Promise<{ username: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      audience: AUDIENCE,
    });
    if (payload.role !== "admin" || !payload.sub) return null;
    return { username: payload.sub };
  } catch {
    return null;
  }
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export const ADMIN_COOKIE = COOKIE;
