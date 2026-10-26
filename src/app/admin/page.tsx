import Link from "next/link";
import { EmptyRow, PageHeader, StatusBadge } from "@/components/admin/PageHeader";
import { ToolLogo } from "@/components/ToolLogo";
import { daysAgo } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const since = daysAgo(7);
  const [published, drafts, submissions, clicks, views, tools] = await Promise.all([
    prisma.tool.count({ where: { status: "PUBLISHED" } }),
    prisma.tool.count({ where: { status: "DRAFT" } }),
    prisma.tool.count({ where: { status: "DRAFT", submittedAt: { not: null } } }),
    prisma.event.count({ where: { type: "OUTBOUND_CLICK", createdAt: { gte: since } } }),
    prisma.event.count({ where: { type: "DETAIL_VIEW", createdAt: { gte: since } } }),
    prisma.tool.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { creator: true },
    }),
  ]);
  const ctr = views ? Math.round((clicks / views) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="How redmoth is doing this week."
        actions={
          <Link href="/admin/tools/new" className="btn btn-primary">
            + New tool
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published" value={published} />
        <Stat
          label="Drafts"
          value={drafts}
          hint={submissions ? `${submissions} public submission${submissions === 1 ? "" : "s"} to review` : drafts ? "Waiting to go live" : undefined}
        />
        <Stat label="Detail views · 7d" value={views} />
        <Stat label="Visits · 7d" value={clicks} hint={views ? `${ctr}% of views` : undefined} accent />
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 className="">Recently updated</h2>
          <Link href="/admin/tools" className="btn btn-ghost btn-sm">
            All tools →
          </Link>
        </div>
        {tools.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {tools.map((tool) => (
              <li key={tool.id}>
                <Link
                  href={`/admin/tools/${tool.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-[var(--bg)]"
                >
                  <ToolLogo src={tool.logoUrl} name={tool.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{tool.name}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{tool.creator.name}</p>
                  </div>
                  <StatusBadge status={tool.status} />
                  <span className="hidden text-xs text-[var(--faint)] sm:block">
                    {tool.updatedAt.toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>No tools yet. Add your first one.</EmptyRow>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? "border-[var(--ink)] bg-[var(--accent)]" : ""}`}>
      <p className={`text-xs font-bold ${accent ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{label}</p>
      <p className="font-display mt-2 text-5xl leading-none">{value}</p>
      {hint ? <p className={`mt-2 text-xs ${accent ? "text-[var(--ink-soft)]" : "text-[var(--faint)]"}`}>{hint}</p> : null}
    </div>
  );
}
