import { NextResponse } from "next/server";
import { ApiError, callApi } from "@/lib/api";

/**
 * Browser-facing endpoint for "email me a sign-in link".
 *
 * The browser can't call go54 directly — it doesn't hold the shared secret —
 * so this route is the hop that signs the request.
 */
export async function POST(request: Request) {
  let email: string;
  try {
    const body = await request.json();
    email = String(body?.email ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 422 },
    );
  }

  try {
    await callApi("auth/request-link", { method: "POST", body: { email } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      // Pass the rate-limit message through; hide anything else.
      const message =
        error.status === 429
          ? error.message
          : "We couldn't send that link. Please try again.";
      return NextResponse.json({ error: message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
