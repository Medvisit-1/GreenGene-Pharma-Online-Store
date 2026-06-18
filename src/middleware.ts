import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Keep in sync with ADMIN_COOKIE in src/lib/auth.ts. Inlined here so this
// Edge-runtime middleware doesn't import the server-only auth module.
const ADMIN_COOKIE = "gg_admin";

// Routing guard only (cookie presence). Signature verification happens in the
// admin layout server-side. Keeps middleware Edge-safe (no crypto here).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasCookie = req.cookies.has(ADMIN_COOKIE);
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
