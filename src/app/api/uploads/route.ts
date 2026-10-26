import { NextResponse } from "next/server";
import { getCurrentCreator } from "@/lib/creator-auth";
import { presignResponse } from "@/lib/uploads";

/** Presigned upload for signed-in creators (submissions, flows, avatars). Raster images only. */
export async function POST(request: Request) {
  const creator = await getCurrentCreator();
  if (!creator) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  return presignResponse(request);
}
