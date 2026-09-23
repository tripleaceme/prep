import { NextResponse, type NextRequest } from "next/server";
import { callApi } from "@/lib/api";
import { createSession } from "@/lib/session";

interface VerifyResponse {
  user: {
    id: string;
    email: string;
    display_name: string | null;
    onboarded: boolean;
  };
}

/**
 * Where the magic link lands. Burns the token on go54, mints the session
 * cookie, then sends the user to onboarding or straight to the dashboard.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing", request.url));
  }

  try {
    const { user } = await callApi<VerifyResponse>("auth/verify", {
      method: "POST",
      body: { token },
    });

    await createSession({ userId: user.id, email: user.email });

    return NextResponse.redirect(
      new URL(user.onboarded ? "/dashboard" : "/onboarding", request.url),
    );
  } catch {
    // Expired, already used, or tampered with — all the same to the user.
    return NextResponse.redirect(new URL("/login?error=expired", request.url));
  }
}
