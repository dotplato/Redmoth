import { NextResponse } from "next/server";
import { getCreatorSession } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";

/** Body is { toolId } for an app or { flowId } for a flow. */
async function readTarget(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.flowId === "string") return { kind: "flow" as const, id: body.flowId as string };
  if (typeof body?.toolId === "string") return { kind: "tool" as const, id: body.toolId as string };
  return null;
}

/** Save an app or flow to the signed-in creator's collection (idempotent). */
export async function POST(request: Request) {
  const session = await getCreatorSession();
  if (!session) return NextResponse.json({ error: "Log in to save" }, { status: 401 });
  const target = await readTarget(request);
  const creatorId = session.sub;

  if (target?.kind === "flow") {
    const flow = await prisma.flow.findUnique({ where: { id: target.id }, select: { id: true } });
    if (!flow) return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    await prisma.savedFlow.upsert({
      where: { creatorId_flowId: { creatorId, flowId: flow.id } },
      create: { creatorId, flowId: flow.id },
      update: {},
    });
    return NextResponse.json({ saved: true });
  }

  const tool = target ? await prisma.tool.findFirst({ where: { id: target.id, status: "PUBLISHED" }, select: { id: true } }) : null;
  if (!tool) return NextResponse.json({ error: "App not found" }, { status: 404 });
  await prisma.savedTool.upsert({
    where: { creatorId_toolId: { creatorId, toolId: tool.id } },
    create: { creatorId, toolId: tool.id },
    update: {},
  });
  return NextResponse.json({ saved: true });
}

/** Remove an app or flow from the collection (idempotent). */
export async function DELETE(request: Request) {
  const session = await getCreatorSession();
  if (!session) return NextResponse.json({ error: "Log in to save" }, { status: 401 });
  const target = await readTarget(request);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.kind === "flow") await prisma.savedFlow.deleteMany({ where: { creatorId: session.sub, flowId: target.id } });
  else await prisma.savedTool.deleteMany({ where: { creatorId: session.sub, toolId: target.id } });
  return NextResponse.json({ saved: false });
}
