import { NextResponse, type NextRequest } from "next/server";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";

/**
 * Where the confirmation link lands.
 *
 * Deliberately does *not* create a session. Clicking the link proves the
 * person holds the inbox, but not that they intended to sign in on this
 * device — and minting a session here would turn every verification email into
 * a permanent magic link sitting in their mailbox. If they already have a
 * session we send them back into the app; otherwise to sign-in with a notice.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  const back = (path: string, status: string) => {
    const url = new URL(path, request.url);
    url.searchParams.set("verified", status);
    return NextResponse.redirect(url);
  };

  const session = await readSession();
  const home = session ? "/dashboard" : "/login";

  if (!token) return back(home, "invalid");

  try {
    await callApi<{ user: unknown; alreadyVerified?: boolean }>(
      "auth/verify-email",
      { method: "POST", body: { token } },
    );
    return back(home, "ok");
  } catch {
    // Expired, already used against an unverified account, or tampered with.
    return back(home, "expired");
  }
}
