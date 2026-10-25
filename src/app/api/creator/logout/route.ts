import { NextResponse } from "next/server";
import { clearCreatorCookie } from "@/lib/creator-auth";

export async function POST(request: Request) {
  await clearCreatorCookie();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
