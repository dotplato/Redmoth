import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLE, auth } from "@/lib/auth";
import { isAdminHost } from "@/lib/host";

// Runs on Node.js (Next 16 proxy), so the admin guard checks the real session and role, not just a cookie.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const admin = isAdminHost(host);

  // Better Auth serves both domains (sign-in on the admin domain, everything on the site).
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  if (admin) {
    if (pathname.startsWith("/api") && !pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      const rewritten = NextResponse.rewrite(url);
      return await guardAdmin(request, rewritten, url.pathname);
    }

    return await guardAdmin(request, NextResponse.next(), pathname);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.next();
}

async function guardAdmin(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/logout";

  if (isLogin) return response;

  // Read-only check: refreshing the session cookie is left to the page/API that handles the request.
  const session = await auth.api.getSession({ headers: request.headers, query: { disableRefresh: true } });
  if (session?.user.role === ADMIN_ROLE) return response;

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = request.nextUrl.clone();
  login.pathname = "/admin/login";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
