import { NextResponse } from "next/server";
import { HERO_SLOT_COUNT } from "@/lib/hero-slots";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

/**
 * Replace the hero network's curated slots. Body: { toolIds: (string | null)[] } indexed by slot.
 * An all-empty list clears curation, which puts the hero back on automatic.
 */
export async function PUT(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const body = await request.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.toolIds) ? body.toolIds.slice(0, HERO_SLOT_COUNT) : [];
  const picks = raw.map((id, position) => (typeof id === "string" && id ? { position, toolId: id } : null)).filter((p) => p !== null);

  const ids = picks.map((p) => p.toolId);
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "Each app can only appear in one slot" }, { status: 400 });
  }
  const live = await prisma.tool.count({ where: { id: { in: ids }, status: "PUBLISHED" } });
  if (live !== ids.length) {
    return NextResponse.json({ error: "Only published apps can be placed in the hero" }, { status: 400 });
  }

  await prisma.$transaction([prisma.heroSlot.deleteMany({}), ...picks.map((p) => prisma.heroSlot.create({ data: p }))]);
  return NextResponse.json({ slots: picks.length, mode: picks.length ? "curated" : "automatic" });
}
