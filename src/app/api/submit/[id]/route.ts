import { unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentCreator } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";
import { readSubmission, resolveMaker, submissionFields } from "@/lib/submission";

type Ctx = { params: Promise<{ id: string }> };

/** Edit a listing that wasn't approved and send it back for review. Only its submitter can do this. */
export async function PATCH(request: Request, { params }: Ctx) {
  const creator = await getCurrentCreator();
  if (!creator) return NextResponse.json({ errors: { form: "Please log in first." } }, { status: 401 });
  const { id } = await params;

  const tool = await prisma.tool.findUnique({ where: { id }, include: { screenshots: true } });
  const owns = tool && (tool.submittedById === creator.id || (tool.creatorId === creator.id && tool.submittedAt));
  if (!tool || !owns) return NextResponse.json({ errors: { form: "App not found." } }, { status: 404 });
  if (tool.status !== "REJECTED") {
    return NextResponse.json({ errors: { form: "Only apps that weren't approved can be edited and resubmitted." } }, { status: 409 });
  }

  const form = await request.formData();
  // Screenshots the maker kept (only ids that belong to this app count).
  const keepIds = new Set(form.getAll("keepScreenshot").map(String));
  const kept = tool.screenshots.filter((shot) => keepIds.has(shot.id));
  const removed = tool.screenshots.filter((shot) => !keepIds.has(shot.id));

  const result = await readSubmission(form, { existingLogo: Boolean(tool.logoUrl), keptScreenshots: kept.length });
  if (!result.ok) return result.response;
  const { data, logoUrl, screenshotUrls, categoryId } = result;

  const creatorId = await resolveMaker(creator, data.makerName, data.name);
  const lastOrder = Math.max(0, ...kept.map((shot) => shot.sortOrder));
  await prisma.$transaction([
    prisma.screenshot.deleteMany({ where: { id: { in: removed.map((shot) => shot.id) } } }),
    prisma.tool.update({
      where: { id },
      data: {
        ...submissionFields(data),
        logoUrl: logoUrl ?? tool.logoUrl,
        categoryId,
        creatorId,
        status: "DRAFT",
        submittedAt: new Date(),
        reviewedAt: null, // reviewNote stays so the admin can see what was asked for last time
        screenshots: {
          create: screenshotUrls.map((imageUrl, index) => ({
            imageUrl,
            alt: `${data.name} screenshot ${kept.length + index + 1}`,
            sortOrder: lastOrder + index + 1,
          })),
        },
      },
    }),
    prisma.adminNotification.create({
      data: {
        type: "RESUBMISSION",
        title: `Resubmitted: ${data.name}`,
        body: `${creator.name} (${creator.email}) updated ${data.name} after review feedback and sent it back for review.`,
        toolId: id,
      },
    }),
  ]);

  // Remove files for screenshots the maker deleted (only ever inside public/uploads).
  const uploads = path.join(process.cwd(), "public", "uploads");
  for (const shot of removed) {
    const file = path.join(process.cwd(), "public", shot.imageUrl);
    if (shot.imageUrl.startsWith("/uploads/") && file.startsWith(uploads + path.sep)) await unlink(file).catch(() => {});
  }

  return NextResponse.json({ tool: { id, slug: tool.slug, name: data.name } });
}
