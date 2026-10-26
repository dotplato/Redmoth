import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/admin/PageHeader";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { FlowMark } from "@/components/FlowMark";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ToolLogo } from "@/components/ToolLogo";
import { getCurrentCreator } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your account", ...NOINDEX };

export default async function AccountPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const [tools, flows] = await Promise.all([
    prisma.tool.findMany({
      // Apps listed under this profile, plus ones this account submitted for another maker/company.
      where: { OR: [{ creatorId: creator.id }, { submittedById: creator.id }] },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.flow.findMany({
      where: { authorId: creator.id },
      orderBy: { createdAt: "desc" },
      include: { category: true, stack: { orderBy: { position: "asc" }, include: { tool: { select: { name: true, logoUrl: true } } } }, _count: { select: { steps: true } } },
    }),
  ]);

  return (
    <div className="container-page py-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Creator account</p>
          <h1 className="mt-2 text-5xl leading-none">Hi, {creator.name}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{creator.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/saved" className="btn btn-outline">
            Saved
          </Link>
          <Link href={`/creators/${creator.slug}`} className="btn btn-outline">
            View public profile
          </Link>
          <form action="/api/creator/logout" method="post">
            <PendingSubmitButton pendingLabel="Logging out…" className="btn btn-ghost">
              Log out
            </PendingSubmitButton>
          </form>
        </div>
      </div>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <h2 className="text-xl">Your apps</h2>
            <Link href="/submit" className="btn btn-accent btn-sm">
              + Submit an app
            </Link>
          </div>
          {tools.length ? (
            <ul className="divide-y divide-[var(--line)]">
              {tools.map((tool) => (
                <li key={tool.id} className="flex items-center gap-4 px-5 py-4">
                  <ToolLogo src={tool.logoUrl} name={tool.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{tool.name}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{tool.category.name}</p>
                    {tool.reviewNote ? (
                      <p className={`mt-1 text-xs leading-5 ${tool.status === "REJECTED" ? "text-[var(--danger)]" : "text-[var(--ink-soft)]"}`}>
                        <span className="font-bold">Feedback:</span> {tool.reviewNote}
                      </p>
                    ) : null}
                  </div>
                  {tool.status === "DRAFT" && tool.submittedAt ? (
                    <span className="badge badge-draft">In review</span>
                  ) : tool.status === "REJECTED" ? (
                    <span className="badge badge-rejected">Not approved</span>
                  ) : (
                    <StatusBadge status={tool.status} />
                  )}
                  {tool.status === "PUBLISHED" ? (
                    <Link href={`/tools/${tool.slug}`} className="btn btn-outline btn-sm">
                      View
                    </Link>
                  ) : tool.status === "REJECTED" ? (
                    <Link href={`/account/apps/${tool.id}/edit`} className="btn btn-accent btn-sm">
                      Edit &amp; resubmit
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-14 text-center">
              <p className="text-xl font-bold">No apps yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Submit your first app. Listing is free.</p>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:order-last lg:col-span-2">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <h2 className="text-xl">Your flows</h2>
              <Link href="/flows/new" className="btn btn-outline btn-sm">
                + Create Flow
              </Link>
            </div>
            {flows.length ? (
              <ul className="divide-y divide-[var(--line)]">
                {flows.map((flow) => (
                  <li key={flow.id} className="flex items-center gap-4 px-5 py-4">
                    <FlowMark logoUrl={flow.logoUrl} title={flow.title} stack={flow.stack.map((item) => item.tool)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{flow.title}</p>
                      <p className="truncate text-sm text-[var(--muted)]">
                        {flow.category.name} · {flow._count.steps} steps · {flow.visits} {flow.visits === 1 ? "visit" : "visits"}
                      </p>
                    </div>
                    {flow.featured ? <span className="tag-featured">Featured</span> : null}
                    <Link href={`/flows/${flow.slug}/edit`} className="btn btn-ghost btn-sm">
                      Edit
                    </Link>
                    <Link href={`/flows/${flow.slug}`} className="btn btn-outline btn-sm">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-12 text-center">
                <p className="text-xl font-bold">No flows yet</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Share the apps you use together and how. Flows go live right away.</p>
              </div>
            )}
          </section>
        </div>

        <ProfileForm
          creator={{ name: creator.name, bio: creator.bio, website: creator.website, avatarUrl: creator.avatarUrl }}
        />
      </div>
    </div>
  );
}
