import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type Ctx = { params: Promise<{ id: string }> };

const reviewPayload = z
  .object({
    decision: z.enum(["publish", "reject"]),
    feedback: z.string().trim().max(2000).optional().default(""),
  })
  .refine((data) => data.decision === "publish" || data.feedback.length >= 10, {
    path: ["feedback"],
    message: "Tell the maker why it wasn't approved (at least 10 characters)",
  });

/** Publish or reject a submission, record the feedback, and email the submitter. */
export async function POST(request: Request, { params }: Ctx) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;

  const parsed = reviewPayload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review" }, { status: 400 });
  }
  const { decision, feedback } = parsed.data;

  const tool = await prisma.tool.findUnique({ where: { id }, include: { creator: true } });
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  const published = decision === "publish";
  const updated = await prisma.tool.update({
    where: { id },
    data: { status: published ? "PUBLISHED" : "REJECTED", reviewNote: feedback || null, reviewedAt: new Date() },
  });
  await prisma.adminNotification.updateMany({ where: { toolId: id, read: false }, data: { read: true } });

  let email: { status: string; error?: string } | null = null;
  if (tool.submitterEmail) {
    const site = process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";
    const text = published
      ? [
          `Good news — ${tool.name} has been approved and is now live on redmoth.`,
          "",
          `See it here: ${site}/tools/${tool.slug}`,
          ...(feedback ? ["", "A note from our team:", feedback] : []),
          "",
          "Thanks for listing with us,",
          "The redmoth team",
        ].join("\n")
      : [
          `Thanks for submitting ${tool.name} to redmoth. We weren't able to approve it this time.`,
          "",
          "Feedback from our team:",
          feedback,
          "",
          `You can make changes and submit again at ${site}/submit.`,
          "",
          "The redmoth team",
        ].join("\n");
    email = await sendEmail({
      to: tool.submitterEmail,
      subject: published ? `${tool.name} is live on redmoth` : `Update on your redmoth submission: ${tool.name}`,
      text,
      toolId: tool.id,
    });
  }

  return NextResponse.json({ tool: { id: updated.id, status: updated.status }, email });
}
