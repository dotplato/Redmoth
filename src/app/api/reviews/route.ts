import { NextResponse } from "next/server";
import { getCreatorSession } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";

const MAX_BODY = 1000;

type Target = { kind: "tool" | "flow"; id: string };

async function readTarget(body: { kind?: unknown; id?: unknown } | null): Promise<Target | null> {
  if ((body?.kind !== "tool" && body?.kind !== "flow") || typeof body.id !== "string") return null;
  return { kind: body.kind, id: body.id };
}

/** Add or update the signed-in account's review: { kind, id, rating 1–5, body? }. */
export async function POST(request: Request) {
  const session = await getCreatorSession();
  if (!session) return NextResponse.json({ error: "Log in to leave a review." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const target = await readTarget(body);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Pick 1 to 5 stars." }, { status: 400 });
  const text = typeof body.body === "string" ? body.body.trim().slice(0, MAX_BODY) : "";
  const creatorId = session.sub;

  if (target.kind === "tool") {
    const tool = await prisma.tool.findFirst({ where: { id: target.id, status: "PUBLISHED" }, select: { id: true, creatorId: true, submittedById: true } });
    if (!tool) return NextResponse.json({ error: "App not found" }, { status: 404 });
    // Makers can't rate their own listing.
    if (tool.creatorId === creatorId || tool.submittedById === creatorId) {
      return NextResponse.json({ error: "You can't review your own app." }, { status: 403 });
    }
    await prisma.toolReview.upsert({
      where: { creatorId_toolId: { creatorId, toolId: tool.id } },
      create: { creatorId, toolId: tool.id, rating, body: text || null },
      update: { rating, body: text || null },
    });
  } else {
    const flow = await prisma.flow.findUnique({ where: { id: target.id }, select: { id: true, authorId: true } });
    if (!flow) return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    if (flow.authorId === creatorId) return NextResponse.json({ error: "You can't review your own flow." }, { status: 403 });
    await prisma.flowReview.upsert({
      where: { creatorId_flowId: { creatorId, flowId: flow.id } },
      create: { creatorId, flowId: flow.id, rating, body: text || null },
      update: { rating, body: text || null },
    });
  }
  return NextResponse.json({ ok: true });
}

/** Remove the signed-in account's review: { kind, id }. */
export async function DELETE(request: Request) {
  const session = await getCreatorSession();
  if (!session) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const target = await readTarget(await request.json().catch(() => null));
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.kind === "tool") await prisma.toolReview.deleteMany({ where: { creatorId: session.sub, toolId: target.id } });
  else await prisma.flowReview.deleteMany({ where: { creatorId: session.sub, flowId: target.id } });
  return NextResponse.json({ ok: true });
}
