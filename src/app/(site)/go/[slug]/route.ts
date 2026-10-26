import { NextResponse } from "next/server";
import { track } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const tool = await prisma.tool.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, websiteUrl: true, affiliateLink: true },
  });

  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  track(tool.id, "OUTBOUND_CLICK");

  // Our affiliate link (set by an admin) takes priority over the plain website.
  const response = NextResponse.redirect(tool.affiliateLink ?? tool.websiteUrl, 302);
  // Affiliate hops shouldn't be indexed or pass ranking signals.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
