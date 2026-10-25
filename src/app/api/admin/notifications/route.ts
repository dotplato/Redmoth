import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

/** Mark notifications read/unread: { ids: string[], read: boolean } or { all: true }. */
export async function PATCH(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const body = await request.json().catch(() => null);
  if (body?.all) {
    const r = await prisma.adminNotification.updateMany({ where: { read: false }, data: { read: true } });
    return NextResponse.json({ updated: r.count });
  }
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];
  if (!ids.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const r = await prisma.adminNotification.updateMany({ where: { id: { in: ids } }, data: { read: body.read !== false } });
  return NextResponse.json({ updated: r.count });
}
