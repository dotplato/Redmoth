import { unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  const shot = await prisma.screenshot.delete({ where: { id } });

  // Remove the image file too, but only ever from inside public/uploads.
  if (shot.imageUrl.startsWith("/uploads/")) {
    const uploads = path.join(process.cwd(), "public", "uploads");
    const file = path.join(process.cwd(), "public", shot.imageUrl);
    if (file.startsWith(uploads + path.sep)) await unlink(file).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
