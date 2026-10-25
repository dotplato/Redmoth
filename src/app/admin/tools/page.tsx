import Link from "next/link";
import { EmptyRow, PageHeader, StatusBadge } from "@/components/admin/PageHeader";
import { ScoreBadge } from "@/components/forms/ScoreMeter";
import { ToolLogo } from "@/components/ToolLogo";
import { scoreTool } from "@/lib/listing-score";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const tools = await prisma.tool.findMany({
    include: { creator: true, category: true, _count: { select: { screenshots: true } } },
    // Fresh public submissions first, so they don't get lost in the list.
    orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Tools"
        description={`${tools.length} listed`}
        actions={
          <Link href="/admin/tools/new" className="btn btn-primary">
            + New tool
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {tools.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-3 font-bold">Tool</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Score</th>
                  <th className="px-3 py-3 font-bold">Category</th>
                  <th className="px-3 py-3 font-bold">Creator</th>
                  <th className="px-3 py-3 text-right font-bold">Shots</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {tools.map((tool) => {
                  const score = scoreTool(tool);
                  return (
                    <tr key={tool.id} className="transition hover:bg-[var(--bg)]">
                      <td className="px-5 py-3">
                        <Link href={`/admin/tools/${tool.id}`} className="flex items-center gap-3">
                          <ToolLogo src={tool.logoUrl} name={tool.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-bold">{tool.name}</span>
                            <span className="block truncate text-xs text-[var(--faint)]">/{tool.slug}</span>
                          </span>
                          {tool.status === "DRAFT" && tool.submittedAt ? <span className="tag-submitted">Submitted</span> : null}
                          {tool.featured ? <span className="tag-featured">Featured</span> : null}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={tool.status} />
                      </td>
                      <td className="px-3 py-3">
                        <ScoreBadge score={score.score} level={score.level} missing={score.nextSteps.map((step) => step.label)} />
                      </td>
                      <td className="px-3 py-3 text-[var(--muted)]">{tool.category.name}</td>
                      <td className="px-3 py-3 text-[var(--muted)]">{tool.creator.name}</td>
                      <td className="px-3 py-3 text-right text-xs text-[var(--muted)]">{tool._count.screenshots}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/admin/tools/${tool.id}`} className="btn btn-outline btn-sm">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyRow>
            No tools yet.{" "}
            <Link href="/admin/tools/new" className="font-bold text-[var(--accent-ink)]">
              Add one with AI →
            </Link>
          </EmptyRow>
        )}
      </div>
    </div>
  );
}
