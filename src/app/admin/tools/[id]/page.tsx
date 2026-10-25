import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/admin/PageHeader";
import { ReviewPanel } from "@/components/admin/ReviewPanel";
import { ToolForm } from "@/components/admin/ToolForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tool, creators, categories] = await Promise.all([
    prisma.tool.findUnique({
      where: { id },
      include: { screenshots: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.creator.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!tool) notFound();

  return (
    <div>
      <PageHeader
        title={tool.name}
        description={<StatusBadge status={tool.status} />}
        back={{ href: "/admin/tools", label: "Tools" }}
        actions={
          tool.status === "PUBLISHED" ? (
            <a
              href={`${process.env.PUBLIC_SITE_URL ?? "http://localhost:3000"}/tools/${tool.slug}`}
              target="_blank"
              rel="noopener"
              className="btn btn-outline btn-sm"
            >
              View live ↗
            </a>
          ) : null
        }
      />
      {tool.submittedAt ? (
        <ReviewPanel
          toolId={tool.id}
          status={tool.status}
          submitterEmail={tool.submitterEmail}
          submittedAt={tool.submittedAt.toISOString()}
          reviewedAt={tool.reviewedAt?.toISOString() ?? null}
          reviewNote={tool.reviewNote}
        />
      ) : null}
      <ToolForm tool={tool} creators={creators} categories={categories} />
    </div>
  );
}
