import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/** Paths reachable without a session. */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  // Shown immediately after an account is deleted, when by definition there is
  // no session left to check.
  "/goodbye",
  // Analytics gates itself on a separate admin session, so it must not be
  // bounced to the user sign-in page.
  "/analytics",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)),
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-touch-icon.png|icon-192.png|icon-512.png|og-image.png|site.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
