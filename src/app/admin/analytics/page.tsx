import Link from "next/link";
import { EmptyRow, PageHeader } from "@/components/admin/PageHeader";
import { ToolLogo } from "@/components/ToolLogo";
import { daysAgo } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const since = daysAgo(30);
  const [views, clicks, published, topTools] = await Promise.all([
    prisma.event.count({ where: { type: "DETAIL_VIEW", createdAt: { gte: since } } }),
    prisma.event.count({ where: { type: "OUTBOUND_CLICK", createdAt: { gte: since } } }),
    prisma.tool.count({ where: { status: "PUBLISHED" } }),
    prisma.event.groupBy({
      by: ["toolId"],
      where: { type: "OUTBOUND_CLICK", createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { toolId: "desc" } },
      take: 10,
    }),
  ]);
  const tools = await prisma.tool.findMany({
    where: { id: { in: topTools.map((row) => row.toolId) } },
    select: { id: true, name: true, logoUrl: true },
  });
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  const max = Math.max(1, ...topTools.map((row) => row._count));
  const ctr = views ? Math.round((clicks / views) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Last 30 days. Visits use the affiliate link when one is set, otherwise the website."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Detail views" value={views} />
        <Stat label="Visits to tool sites" value={clicks} accent />
        <Stat label="Visit rate" value={`${ctr}%`} hint="visits ÷ detail views" />
        <Stat label="Published tools" value={published} />
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <h2 className="">Most visited</h2>
        </div>
        {topTools.length ? (
          <ol className="divide-y divide-[var(--line)]">
            {topTools.map((row, index) => {
              const tool = byId.get(row.toolId);
              return (
                <li key={row.toolId} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="w-5 text-xs text-[var(--faint)]">{index + 1}</span>
                  <ToolLogo src={tool?.logoUrl} name={tool?.name ?? "?"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/admin/tools/${row.toolId}`} className="truncate font-bold hover:underline">
                        {tool?.name ?? "Deleted tool"}
                      </Link>
                      <span className="text-sm">{row._count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-deep)]">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(row._count / max) * 100}%` }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyRow>No visits in the last 30 days yet.</EmptyRow>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: number | string; hint?: string; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? "border-[var(--ink)] bg-[var(--accent)] text-[var(--accent-ink)]" : ""}`}>
      <p className={`text-xs font-bold ${accent ? "" : "text-[var(--muted)]"}`}>{label}</p>
      <p className="font-display mt-2 text-5xl leading-none">{value}</p>
      {hint ? <p className={`mt-2 text-xs ${accent ? "opacity-85" : "text-[var(--faint)]"}`}>{hint}</p> : null}
    </div>
  );
}
