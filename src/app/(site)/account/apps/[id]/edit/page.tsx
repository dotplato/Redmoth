import { notFound, redirect } from "next/navigation";
import { SubmitToolForm, type ExistingListing } from "@/components/forms/SubmitToolForm";
import { getCurrentCreator } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit & resubmit", ...NOINDEX };

export default async function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creator = await getCurrentCreator();
  if (!creator) redirect(`/login?next=${encodeURIComponent(`/account/apps/${id}/edit`)}`);

  const tool = await prisma.tool.findUnique({
    where: { id },
    include: { creator: true, screenshots: { orderBy: { sortOrder: "asc" } } },
  });
  const owns = tool && (tool.submittedById === creator.id || (tool.creatorId === creator.id && tool.submittedAt));
  if (!tool || !owns) notFound();
  // Only listings that weren't approved can be edited here; everything else goes back to the account.
  if (tool.status !== "REJECTED") redirect("/account");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const existing: ExistingListing = {
    id: tool.id,
    name: tool.name,
    tagline: tool.tagline,
    websiteUrl: tool.websiteUrl,
    categoryId: tool.categoryId,
    seoKeywords: tool.seoKeywords ?? "",
    releaseDate: tool.releaseDate ? tool.releaseDate.toISOString().slice(0, 10) : "",
    logoUrl: tool.logoUrl,
    description: tool.description,
    body: tool.body,
    scenario: {
      scenarioUser: tool.scenarioUser ?? "",
      scenarioProblem: tool.scenarioProblem ?? "",
      scenarioHow: tool.scenarioHow ?? "",
      scenarioResult: tool.scenarioResult ?? "",
    },
    pricing: tool.pricing,
    affiliateProgram: tool.affiliateProgram,
    affiliateSignupUrl: tool.affiliateSignupUrl ?? "",
    makerName: tool.creator.name,
    screenshots: tool.screenshots.map((shot) => ({ id: shot.id, imageUrl: shot.imageUrl })),
    reviewNote: tool.reviewNote,
  };

  return (
    <div>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-12 sm:py-14">
          <p className="eyebrow">Not approved · edit &amp; resubmit</p>
          <h1 className="mt-3 text-5xl leading-[1.05] sm:text-6xl">Update {tool.name}</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Make the changes our team asked for, then send it back. It goes straight into the review queue.
          </p>
        </div>
      </section>
      <div className="container-page max-w-6xl py-10 pb-24">
        <SubmitToolForm categories={categories} creator={{ name: creator.name, email: creator.email }} existing={existing} />
      </div>
    </div>
  );
}
