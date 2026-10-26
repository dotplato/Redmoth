import { NextResponse } from "next/server";
import { aiFillTool } from "@/lib/ai-fill";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Tool name is required" }, { status: 400 });
  }

  const [creators, categories] = await Promise.all([
    prisma.creator.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  try {
    const result = await aiFillTool({
      name,
      websiteHint: String(form.get("websiteUrl") ?? "").trim() || undefined,
      description: String(form.get("description") ?? "").trim() || undefined,
      creators,
      categories,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai-fill]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI fill failed" },
      { status: 502 },
    );
  }
}
