import { mkdir, writeFile } from "fs/promises";
import path from "path";
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

  let logoUrl: string | null = null;
  const logo = form.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const ext = path.extname(logo.name) || ".png";
    const filename = `logo-${Date.now()}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), Buffer.from(await logo.arrayBuffer()));
    logoUrl = `/uploads/logos/${filename}`;
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
    return NextResponse.json({ ...result, logoUrl });
  } catch (err) {
    console.error("[ai-fill]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI fill failed", logoUrl },
      { status: 502 },
    );
  }
}
