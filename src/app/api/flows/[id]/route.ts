import { NextResponse } from "next/server";
import { getCurrentCreator } from "@/lib/creator-auth";
import { flowChildren, readFlow } from "@/lib/flows";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** The signed-in author's flow, or an error response. */
async function ownFlow({ params }: Ctx) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: NextResponse.json({ errors: { form: "Please log in first." } }, { status: 401 }) };
  const flow = await prisma.flow.findUnique({ where: { id: (await params).id } });
  if (!flow || flow.authorId !== creator.id) return { error: NextResponse.json({ errors: { form: "Flow not found." } }, { status: 404 }) };
  return { flow };
}

/** Edit a flow: details are updated, the stack and steps are replaced. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { flow, error } = await ownFlow(ctx);
  if (error) return error;

  const result = await readFlow(await request.formData(), { hasLogo: Boolean(flow.logoUrl) });
  if (!result.ok) return result.response;
  const { data } = result;

  const [, , updated] = await prisma.$transaction([
    prisma.flowStep.deleteMany({ where: { flowId: flow.id } }),
    prisma.flowTool.deleteMany({ where: { flowId: flow.id } }),
    prisma.flow.update({
      where: { id: flow.id },
      data: {
        title: data.title,
        summary: data.summary,
        categoryId: data.categoryId,
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...flowChildren(data),
      },
    }),
  ]);
  return NextResponse.json({ flow: { id: updated.id, slug: updated.slug } });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { flow, error } = await ownFlow(ctx);
  if (error) return error;
  await prisma.flow.delete({ where: { id: flow.id } });
  return NextResponse.json({ deleted: true });
}
