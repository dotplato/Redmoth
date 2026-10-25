import { NextResponse } from "next/server";
import { toolPayload } from "@/lib/admin-schema";
import { prisma } from "@/lib/prisma";
import { withScenario } from "@/lib/scenario";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";

export async function GET(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const tools = await prisma.tool.findMany({
    include: { creator: true, category: true, _count: { select: { events: true, screenshots: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ tools });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const parsed = toolPayload.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = { ...parsed.data, slug: slugify(parsed.data.slug), ...withScenario(parsed.data) };
  const tool = await prisma.tool.create({ data });
  return NextResponse.json({ tool }, { status: 201 });
}
