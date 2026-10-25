import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FlowForm } from "@/components/forms/FlowForm";
import { getCurrentCreator } from "@/lib/creator-auth";
import { flowFormOptions } from "@/lib/flow-form-data";
import { prisma } from "@/lib/prisma";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Flow", ...NOINDEX };

export default async function EditFlowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const creator = await getCurrentCreator();
  if (!creator) redirect(`/login?next=/flows/${slug}/edit`);
  const flow = await prisma.flow.findUnique({
    where: { slug },
    include: { stack: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } },
  });
  if (!flow || flow.authorId !== creator.id) notFound();
  const { apps, categories } = await flowFormOptions();

  return (
    <div>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-10 sm:py-12">
          <Link href={`/flows/${flow.slug}`} className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
            ← Back to the flow
          </Link>
          <h1 className="mt-4 text-4xl leading-none sm:text-5xl">Edit “{flow.title}”</h1>
        </div>
      </section>
      <div className="container-page max-w-6xl py-10 pb-24">
        <FlowForm
          apps={apps}
          categories={categories}
          existing={{
            id: flow.id,
            slug: flow.slug,
            title: flow.title,
            summary: flow.summary,
            categoryId: flow.categoryId,
            logoUrl: flow.logoUrl,
            // Apps that were unlisted since drop out of the stack; their steps then ask for another app.
            stack: flow.stack.map((item) => item.toolId).filter((id) => apps.some((app) => app.id === id)),
            steps: flow.steps.map((step) => ({ toolId: step.toolId, title: step.title, description: step.description })),
          }}
        />
      </div>
    </div>
  );
}
