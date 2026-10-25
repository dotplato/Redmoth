import { NextResponse } from "next/server";
import { creatorProfilePayload, fieldErrors } from "@/lib/admin-schema";
import { getCurrentCreator } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";
import { imageFiles, saveImage, UploadError } from "@/lib/uploads";

export async function PATCH(request: Request) {
  const creator = await getCurrentCreator();
  if (!creator) return NextResponse.json({ error: "Log in first" }, { status: 401 });

  const form = await request.formData();
  const parsed = creatorProfilePayload.safeParse({
    name: form.get("name"),
    bio: form.get("bio"),
    website: form.get("website"),
  });
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  let avatarUrl = creator.avatarUrl;
  const avatar = imageFiles(form, "avatar")[0];
  if (avatar) {
    try {
      avatarUrl = await saveImage(avatar, "avatars");
    } catch (err) {
      if (err instanceof UploadError) return NextResponse.json({ errors: { avatar: err.message } }, { status: 400 });
      throw err;
    }
  }

  const updated = await prisma.creator.update({
    where: { id: creator.id },
    data: { ...parsed.data, avatarUrl },
  });
  return NextResponse.json({ creator: { slug: updated.slug } });
}
