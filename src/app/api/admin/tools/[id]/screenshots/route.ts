import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { MAX_SCREENSHOTS } from "@/lib/upload-limits";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;

  const form = await request.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "Product screenshot");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const existing = await prisma.screenshot.count({ where: { toolId: id } });
  if (existing >= MAX_SCREENSHOTS) {
    return NextResponse.json({ error: `A tool can have up to ${MAX_SCREENSHOTS} screenshots` }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".png";
  const filename = `${id}-${Date.now()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "screenshots");
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  const last = await prisma.screenshot.findFirst({
    where: { toolId: id },
    orderBy: { sortOrder: "desc" },
  });

  const shot = await prisma.screenshot.create({
    data: {
      toolId: id,
      imageUrl: `/uploads/screenshots/${filename}`,
      alt,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json({ screenshot: shot }, { status: 201 });
}
