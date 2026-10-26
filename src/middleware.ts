import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readSessionToken } from "@/lib/auth";
import { isAdminHost } from "@/lib/host";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const admin = isAdminHost(host);

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
  const isLogin =
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout";

  if (isLogin) return response;

  const session = await readSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (session) return response;

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
