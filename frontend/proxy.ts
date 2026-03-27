import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name used by Better Auth — keep in sync with backend auth config
const SESSION_COOKIE_NAME = "better-auth.session_token";
const SESSION_COOKIE_NAME_SECURE = "__Secure-better-auth.session_token";

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

function hasSessionCookie(request: NextRequest): boolean {
  const token =
    request.cookies.get(SESSION_COOKIE_NAME) ?? request.cookies.get(SESSION_COOKIE_NAME_SECURE);
  return !!token?.value;
}

/**
 * Next.js middleware — runs on the edge before every matched request.
 *
 * Two rules:
 * 1. Authenticated users hitting auth pages (/login, /register, etc.)
 *    are redirected to /dashboard.
 * 2. Unauthenticated users hitting protected pages (/dashboard/*)
 *    are redirected to /login with a callbackUrl query param.
 *
 * This is a UX guard only — it checks for the presence of the session
 * cookie, not its validity. Real security is enforced server-side by
 * requireSession middleware on the backend.
 *
 * Keep SESSION_COOKIE_NAME in sync with the backend auth config.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasSessionCookie(request);
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Logged-in user hitting an auth page — send them to the dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user hitting a protected page — send them to login
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/forgot-password", "/reset-password"],
};
