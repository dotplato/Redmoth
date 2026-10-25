import { NextResponse } from "next/server";
import { categoryPayload } from "@/lib/admin-schema";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  const parsed = categoryPayload.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = {
    ...parsed.data,
    ...(parsed.data.slug ? { slug: slugify(parsed.data.slug) } : {}),
  };
  const category = await prisma.category.update({ where: { id }, data });
  return NextResponse.json({ category });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  // Tools reference this row with onDelete: Restrict, so explain instead of throwing a 500.
  const inUse = await prisma.tool.count({ where: { categoryId: id } });
  if (inUse) {
    return NextResponse.json(
      { error: `Used by ${inUse} tool${inUse === 1 ? "" : "s"}. Move them to another category first.` },
      { status: 409 },
    );
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
