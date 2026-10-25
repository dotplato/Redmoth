import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totals, byType, topTools, published] = await Promise.all([
    prisma.event.count({ where: { createdAt: { gte: since } } }),
    prisma.event.groupBy({
      by: ["type"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.event.groupBy({
      by: ["toolId"],
      where: { type: "OUTBOUND_CLICK", createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { toolId: "desc" } },
      take: 8,
    }),
    prisma.tool.count({ where: { status: "PUBLISHED" } }),
  ]);

  const tools = await prisma.tool.findMany({
    where: { id: { in: topTools.map((row) => row.toolId) } },
    select: { id: true, name: true, slug: true },
  });
  const names = Object.fromEntries(tools.map((tool) => [tool.id, tool]));

  return NextResponse.json({
    published,
    totals,
    byType,
    topTools: topTools.map((row) => ({
      ...names[row.toolId],
      clicks: row._count,
    })),
  });
}
