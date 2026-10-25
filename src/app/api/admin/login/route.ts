import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, setAdminCookie } from "@/lib/auth";
import { isAdminHost } from "@/lib/host";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken({ sub: user.id, email: user.email });
  await setAdminCookie(token);
  return NextResponse.json({ ok: true });
}
