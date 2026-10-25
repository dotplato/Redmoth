import { NextResponse } from "next/server";
import { getCurrentCreator, uniqueSlug } from "@/lib/creator-auth";
import { flowChildren, readFlow } from "@/lib/flows";
import { prisma } from "@/lib/prisma";

/** Create a flow. No review: it's public as soon as it's saved. */
export async function POST(request: Request) {
  const creator = await getCurrentCreator();
  if (!creator) return NextResponse.json({ errors: { form: "Please log in to create a flow." } }, { status: 401 });

  const result = await readFlow(await request.formData());
  if (!result.ok) return result.response;
  const { data } = result;

  const slug = await uniqueSlug(data.title, async (s) => Boolean(await prisma.flow.findUnique({ where: { slug: s } })));
  const flow = await prisma.flow.create({
    data: {
      title: data.title,
      summary: data.summary,
      slug,
      logoUrl: data.logoUrl ?? null,
      authorId: creator.id,
      categoryId: data.categoryId,
      ...flowChildren(data),
    },
  });
  return NextResponse.json({ flow: { id: flow.id, slug: flow.slug } }, { status: 201 });
}
