import { NextResponse } from "next/server";
import { toolPayload } from "@/lib/admin-schema";
import { prisma } from "@/lib/prisma";
import { withScenario } from "@/lib/scenario";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;

  const parsed = toolPayload.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = {
    ...parsed.data,
    ...(parsed.data.slug ? { slug: slugify(parsed.data.slug) } : {}),
    ...withScenario(parsed.data),
  };

  const tool = await prisma.tool.update({ where: { id }, data });
  return NextResponse.json({ tool });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  await prisma.tool.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
