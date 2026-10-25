import { NextResponse } from "next/server";
import { getCurrentCreator, uniqueSlug } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";
import { readSubmission, resolveMaker, submissionFields } from "@/lib/submission";

export async function POST(request: Request) {
  // Submitting requires a creator account; the /submit page sends visitors to sign up first.
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ errors: { form: "Please log in or create a creator account first." } }, { status: 401 });
  }

  const form = await request.formData();
  // Honeypot: real users never see or fill this field.
  if (String(form.get("company_site") ?? "")) return NextResponse.json({ ok: true }, { status: 201 });

  const result = await readSubmission(form);
  if (!result.ok) return result.response;
  const { data, logoUrl, screenshotUrls, categoryId } = result;

  const creatorId = await resolveMaker(creator, data.makerName, data.name);
  const slug = await uniqueSlug(data.name, async (s) => Boolean(await prisma.tool.findUnique({ where: { slug: s } })));
  const tool = await prisma.tool.create({
    data: {
      ...submissionFields(data),
      slug,
      logoUrl,
      status: "DRAFT",
      submitterEmail: creator.email,
      submittedById: creator.id,
      submittedAt: new Date(),
      creatorId,
      categoryId,
      screenshots: {
        create: screenshotUrls.map((imageUrl, index) => ({ imageUrl, alt: `${data.name} screenshot ${index + 1}`, sortOrder: index + 1 })),
      },
    },
  });

  await prisma.adminNotification.create({
    data: {
      type: "SUBMISSION",
      title: `New submission: ${tool.name}`,
      body: `${creator.name} (${creator.email}) submitted ${tool.name} for review.`,
      toolId: tool.id,
    },
  });

  return NextResponse.json({ tool: { id: tool.id, slug: tool.slug, name: tool.name } }, { status: 201 });
}
