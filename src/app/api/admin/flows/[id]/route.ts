import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type Ctx = { params: Promise<{ id: string }> };

/** Feature or unfeature a flow: { featured: boolean }. */
export async function PATCH(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const body = await request.json().catch(() => null);
  if (typeof body?.featured !== "boolean") return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const r = await prisma.flow.updateMany({ where: { id: (await params).id }, data: { featured: body.featured } });
  if (!r.count) return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  return NextResponse.json({ featured: body.featured });
}

/** Take a flow down (e.g. spam). */
export async function DELETE(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  await prisma.flow.deleteMany({ where: { id: (await params).id } });
  return NextResponse.json({ deleted: true });
}
