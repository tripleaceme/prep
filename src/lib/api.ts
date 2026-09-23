import "server-only";

/**
 * Client for the PHP API on go54.
 *
 * Every request is signed with a shared secret over
 * "timestamp.method.path.body", which is what lets the API trust the
 * `X-Prep-User` header. Because the secret must never reach the browser, this
 * module is server-only — importing it from a Client Component is a build
 * error rather than a leak.
 */

const BASE = process.env.PREP_API_URL;
const SECRET = process.env.API_SHARED_SECRET;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface CallOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** The user this request acts for. Omitted for the auth endpoints. */
  userId?: string;
}

export async function callApi<T>(
  path: string,
  { method = "GET", body, userId }: CallOptions = {},
): Promise<T> {
  if (!BASE || !SECRET) {
    throw new ApiError("Prep API is not configured", 500);
  }

  const clean = path.replace(/^\/+/, "");
  const rawBody = body === undefined ? "" : JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Prep-Timestamp": timestamp,
    "X-Prep-Signature": await sign(
      `${timestamp}.${method}.${clean}.${rawBody}`,
    ),
  };
  if (userId) headers["X-Prep-User"] = userId;

  const response = await fetch(`${BASE}/${clean}`, {
    method,
    headers,
    body: method === "POST" ? rawBody : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError("The API returned an unreadable response", 502);
  }

  if (!response.ok) {
    const message =
      (payload as { error?: string } | null)?.error ?? "Request failed";
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
