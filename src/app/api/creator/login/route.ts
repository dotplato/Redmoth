import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { setCreatorCookie } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const creator = email ? await prisma.creator.findUnique({ where: { email } }) : null;
  if (!creator?.passwordHash || !(await compare(password, creator.passwordHash))) {
    return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
  }

  await setCreatorCookie({ sub: creator.id, slug: creator.slug });
  return NextResponse.json({ ok: true });
}
