import Link from "next/link";
import { redirect } from "next/navigation";
import { FlowCard } from "@/components/FlowCard";
import { ToolCard } from "@/components/ToolCard";
import { getSessionUserId } from "@/lib/creator-auth";
import { FLOW_CARD } from "@/lib/flows";
import { prisma } from "@/lib/prisma";
import { VISITS } from "@/lib/queries";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = { title: "Saved", ...NOINDEX };

export default async function SavedPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login?next=/saved");

  // Filtering through the user id skips waiting for the creator row first.
  const [saved, savedFlows] = await Promise.all([
    prisma.savedTool.findMany({
      where: { creator: { userId }, tool: { status: "PUBLISHED" } },
      orderBy: { createdAt: "desc" },
      include: { tool: { include: { category: true, ...VISITS } } },
    }),
    prisma.savedFlow.findMany({
      where: { creator: { userId } },
      orderBy: { createdAt: "desc" },
      include: { flow: { include: FLOW_CARD } },
    }),
  ]);
  const total = saved.length + savedFlows.length;

  return (
    <div className="container-page py-12 pb-24">
      <p className="eyebrow">Your collection</p>
      <h1 className="mt-3 text-5xl leading-none sm:text-6xl">
        Saved <span className="text-[var(--faint)]">· {total}</span>
      </h1>
      <p className="mt-4 max-w-xl text-[var(--muted)]">
        Apps and flows you&rsquo;ve bookmarked, newest first. Tap the bookmark on any card to remove it.
      </p>

      {total ? (
        <>
          {saved.length ? (
            <>
              <h2 className="mt-10 text-2xl">
                Apps <span className="text-[var(--faint)]">· {saved.length}</span>
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {saved.map(({ tool }) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </>
          ) : null}
          {savedFlows.length ? (
            <>
              <h2 className="mt-10 text-2xl">
                Flows <span className="text-[var(--faint)]">· {savedFlows.length}</span>
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedFlows.map(({ flow }) => (
                  <FlowCard key={flow.id} flow={flow} />
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : (
        <div className="card mt-10 grid place-items-center px-6 py-16 text-center">
          <p className="font-display text-3xl">Nothing saved yet.</p>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
            Hover any app or flow card and tap the bookmark to keep it here for later.
          </p>
          <Link href="/tools" className="btn btn-primary mt-6">
            Discover apps
          </Link>
        </div>
      )}
    </div>
  );
}
