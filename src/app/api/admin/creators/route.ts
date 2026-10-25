import { NextResponse } from "next/server";
import { creatorPayload } from "@/lib/admin-schema";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";

export async function GET(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const creators = await prisma.creator.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ creators });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const parsed = creatorPayload.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const website = parsed.data.website ? parsed.data.website : null;
  const creator = await prisma.creator.create({
    data: { ...parsed.data, slug: slugify(parsed.data.slug), website },
  });
  return NextResponse.json({ creator }, { status: 201 });
}
