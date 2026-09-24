import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Operator login for /analytics.
 *
 * Completely separate from user accounts: different credentials, different
 * cookie, and a different JWT audience. A compromised user session cannot be
 * replayed as an admin one, and there is no admin row in the database to find
 * or escalate to — the credentials live only in Vercel's environment.
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

export async function checkAdminCredentials(
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
