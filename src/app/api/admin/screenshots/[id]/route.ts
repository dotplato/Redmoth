import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { deleteByUrl } from "@/lib/storage";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  const shot = await prisma.screenshot.delete({ where: { id } });

  // Remove the image file too, but only ever from our own bucket.
  await deleteByUrl(shot.imageUrl);
  return NextResponse.json({ ok: true });
}
