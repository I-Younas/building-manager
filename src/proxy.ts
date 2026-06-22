import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

// Optimistic, cookie-presence-only check. This is a UX convenience to keep
// logged-out users out of /dashboard early — it is not the security
// boundary. Every server action independently re-verifies auth/org scope
// via requireOrgScope(), since Proxy does not cover Server Function calls.
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: "/dashboard/:path*",
};
