import { NextResponse } from "next/server";
import { getAdminSession } from "./auth";
import { isAdminHost } from "./host";

export async function requireAdmin(request: Request) {
  const host = request.headers.get("host");
  if (!isAdminHost(host)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  const session = await getAdminSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, error: null };
}
