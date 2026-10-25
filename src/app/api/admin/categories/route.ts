import { NextResponse } from "next/server";
import { categoryPayload } from "@/lib/admin-schema";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";

export async function GET(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const parsed = categoryPayload.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const category = await prisma.category.create({
    data: { ...parsed.data, slug: slugify(parsed.data.slug) },
  });
  return NextResponse.json({ category }, { status: 201 });
}
