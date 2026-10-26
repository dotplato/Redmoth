import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { MAX_SCREENSHOTS } from "@/lib/upload-limits";
import { UploadError, verifyUpload } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;

  // The browser has already uploaded the file to R2; we record its URL.
  const form = await request.formData();
  const url = form.get("url");
  const alt = String(form.get("alt") ?? "Product screenshot");
  if (typeof url !== "string" || !url) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const existing = await prisma.screenshot.count({ where: { toolId: id } });
  if (existing >= MAX_SCREENSHOTS) {
    return NextResponse.json({ error: `A tool can have up to ${MAX_SCREENSHOTS} screenshots` }, { status: 400 });
  }

  try {
    await verifyUpload(url, "screenshots", { allowSvg: true });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const last = await prisma.screenshot.findFirst({
    where: { toolId: id },
    orderBy: { sortOrder: "desc" },
  });

  const shot = await prisma.screenshot.create({
    data: {
      toolId: id,
      imageUrl: url,
      alt,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json({ screenshot: shot }, { status: 201 });
}
