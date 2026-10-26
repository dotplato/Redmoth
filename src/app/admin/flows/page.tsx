import { EmptyRow, PageHeader } from "@/components/admin/PageHeader";
import { FlowAdminActions } from "@/components/admin/FlowAdminActions";
import { FlowMark } from "@/components/FlowMark";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFlowsPage() {
  const flows = await prisma.flow.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, user: { select: { email: true } } } },
      category: true,
      stack: { orderBy: { position: "asc" }, include: { tool: { select: { name: true, logoUrl: true } } } },
      _count: { select: { steps: true, savedBy: true } },
    },
  });
  const site = process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div>
      <PageHeader title="Flows" description={`${flows.length} published · made by users, live without review. Feature the best ones.`} />

      <div className="card overflow-hidden">
        {flows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-3 font-bold">Flow</th>
                  <th className="px-3 py-3 font-bold">Author</th>
                  <th className="px-3 py-3 font-bold">Category</th>
                  <th className="px-3 py-3 text-right font-bold">Steps</th>
                  <th className="px-3 py-3 text-right font-bold">Visits</th>
                  <th className="px-3 py-3 text-right font-bold">Saves</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {flows.map((flow) => (
                  <tr key={flow.id} className="transition hover:bg-[var(--bg)]">
                    <td className="px-5 py-3">
                      <a href={`${site}/flows/${flow.slug}`} target="_blank" rel="noopener" className="flex items-center gap-3">
                        <FlowMark logoUrl={flow.logoUrl} title={flow.title} stack={flow.stack.map((item) => item.tool)} />
                        <span className="min-w-0">
                          <span className="block max-w-[260px] truncate font-bold">{flow.title}</span>
                          <span className="block text-xs text-[var(--faint)]">
                            {flow.stack.length} apps · {flow.createdAt.toLocaleDateString("en", { month: "short", day: "numeric" })} ↗
                          </span>
                        </span>
                      </a>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      <span className="block">{flow.author.name}</span>
                      {flow.author.user ? <span className="block text-xs text-[var(--faint)]">{flow.author.user.email}</span> : null}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">{flow.category.name}</td>
                    <td className="px-3 py-3 text-right text-[var(--muted)]">{flow._count.steps}</td>
                    <td className="px-3 py-3 text-right text-[var(--muted)]">{flow.visits}</td>
                    <td className="px-3 py-3 text-right text-[var(--muted)]">{flow._count.savedBy}</td>
                    <td className="px-5 py-3">
                      <FlowAdminActions id={flow.id} title={flow.title} featured={flow.featured} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyRow>No flows yet. They appear here as soon as users publish them.</EmptyRow>
        )}
      </div>
    </div>
  );
}
