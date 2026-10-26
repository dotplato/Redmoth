import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { DeleteFlowButton } from "@/components/DeleteFlowButton";
import { JsonLd } from "@/components/JsonLd";
import { FlowCard } from "@/components/FlowCard";
import { FlowMark } from "@/components/FlowMark";
import { ReviewSection } from "@/components/ReviewSection";
import { SaveButton } from "@/components/SaveButton";
import { Visits } from "@/components/ToolCard";
import { ToolLogo } from "@/components/ToolLogo";
import { getCreatorSession } from "@/lib/creator-auth";
import { FLOW_CARD, getFlowBySlug } from "@/lib/flows";
import { prisma } from "@/lib/prisma";
import { loadReviews } from "@/lib/reviews";
import { NOINDEX, absoluteUrl, breadcrumbs, snippet } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const flow = await getFlowBySlug((await params).slug);
  if (!flow) return { title: "Flow not found", ...NOINDEX };
  const apps = flow.stack.filter((item) => item.tool.status === "PUBLISHED").map((item) => item.tool.name);
  const description = snippet(
    `${flow.summary} A ${flow.steps.length}-step ${flow.category.name} workflow${apps.length ? ` using ${apps.slice(0, 4).join(", ")}` : ""}.`,
  );
  return {
    title: `${flow.title} — ${flow.category.name} AI workflow`,
    description,
    alternates: { canonical: `/flows/${flow.slug}` },
    openGraph: {
      type: "article",
      url: `/flows/${flow.slug}`,
      title: flow.title,
      description,
      ...(flow.logoUrl ? { images: [{ url: flow.logoUrl, alt: flow.title }] } : {}),
    },
  };
}

export default async function FlowPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ slug }, { created }] = await Promise.all([params, searchParams]);
  const flow = await getFlowBySlug(slug);
  if (!flow) notFound();

  // Everything below only needs the flow, so it loads in parallel (reviews also wait for the viewer).
  const sessionLoad = getCreatorSession();
  const [session, reviews, more] = await Promise.all([
    sessionLoad,
    sessionLoad.then((viewer) => loadReviews("flow", flow.id, viewer?.sub ?? null)),
    prisma.flow.findMany({
      where: { id: { not: flow.id }, categoryId: flow.categoryId },
      include: FLOW_CARD,
      orderBy: [{ featured: "desc" }, { visits: "desc" }],
      take: 3,
    }),
  ]);
  const isAuthor = session?.sub === flow.authorId;
  // Count real visitors, not the author checking their own flow. Written after the response is sent.
  if (!isAuthor) after(() => prisma.flow.update({ where: { id: flow.id }, data: { visits: { increment: 1 } } }));

  const stack = flow.stack.filter((item) => item.tool.status === "PUBLISHED").map((item) => item.tool);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: flow.title,
    description: flow.summary,
    url: absoluteUrl(`/flows/${flow.slug}`),
    dateModified: flow.updatedAt.toISOString(),
    author: { "@type": "Person", name: flow.author.name, url: absoluteUrl(`/creators/${flow.author.slug}`) },
    tool: stack.map((app) => ({ "@type": "HowToTool", name: app.name, url: absoluteUrl(`/tools/${app.slug}`) })),
    step: flow.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.description,
    })),
    ...(reviews.count
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.avg, ratingCount: reviews.count, bestRating: 5, worstRating: 1 } }
      : {}),
  };

  return (
    <div>
      <JsonLd
        data={[
          jsonLd,
          breadcrumbs([
            { name: "Flows", path: "/flows" },
            { name: flow.category.name, path: `/flows?category=${flow.category.slug}` },
            { name: flow.title, path: `/flows/${flow.slug}` },
          ]),
        ]}
      />
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="glow pointer-events-none absolute inset-0 opacity-70" />
        <div className="container-page relative pb-10 pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Link href="/flows" className="hover:text-[var(--ink)]">
              Flows
            </Link>
            <span className="text-[var(--line-strong)]">/</span>
            <Link href={`/flows?category=${flow.category.slug}`} className="hover:text-[var(--ink)]">
              {flow.category.name}
            </Link>
          </nav>

          {created && isAuthor ? (
            <p role="status" className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--ink)] bg-[var(--accent-soft)] px-4 py-3 text-sm">
              <span className="font-bold">Your flow is live.</span> It&rsquo;s on Discover now. Share the link or keep refining it.
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <FlowMark logoUrl={flow.logoUrl} title={flow.title} stack={stack} size="lg" />
              <div className="min-w-0">
                <p className="eyebrow">Flow</p>
                <h1 className="mt-1 text-4xl leading-[1.05] sm:text-5xl">{flow.title}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-7 text-[var(--ink-soft)]">{flow.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                  <span>
                    by{" "}
                    <Link
                      href={`/creators/${flow.author.slug}`}
                      className="font-bold text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--ink)]"
                    >
                      {flow.author.name}
                    </Link>
                  </span>
                  <span className="eyebrow rounded-full border border-[var(--line-strong)] px-2.5 py-1">{flow.category.name}</span>
                  <span>
                    {flow.steps.length} steps · {stack.length} apps
                  </span>
                  <Visits count={flow.visits} />
                  {flow.featured ? <span className="tag-featured">Featured</span> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SaveButton toolId={flow.id} name={flow.title} kind="flow" variant="full" />
              {isAuthor ? (
                <>
                  <Link href={`/flows/${flow.slug}/edit`} className="btn btn-outline btn-lg">
                    Edit
                  </Link>
                  <DeleteFlowButton id={flow.id} title={flow.title} />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid grid-cols-[minmax(0,1fr)] items-start gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <article className="min-w-0">
          <p className="eyebrow">Step by step</p>
          <ol className="mt-6">
            {flow.steps.map((step, i) => {
              const live = step.tool.status === "PUBLISHED";
              return (
                <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-6">
                  {/* Rail joining the step numbers. */}
                  {i < flow.steps.length - 1 ? <span aria-hidden className="absolute left-[19px] top-11 bottom-1 w-px bg-[var(--line-strong)]" /> : null}
                  <span className="font-display relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] ring-1 ring-[var(--ink)]">
                    {i + 1}
                  </span>
                  <div className="card min-w-0 flex-1 p-5">
                    {live ? (
                      <Link href={`/tools/${step.tool.slug}`} className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] py-1 pl-1 pr-3 text-xs font-bold hover:border-[var(--ink)]">
                        <AppDot app={step.tool} />
                        {step.tool.name}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--line-strong)] py-1 pl-1 pr-3 text-xs text-[var(--muted)]">
                        <AppDot app={step.tool} />
                        {step.tool.name} · no longer listed
                      </span>
                    )}
                    <h2 className="mt-3 text-xl leading-7">{step.title}</h2>
                    <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-[var(--ink-soft)]">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </article>

        <aside className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:sticky lg:top-24">
          <section className="card p-5">
            <p className="eyebrow">The stack · {stack.length}</p>
            <ul className="mt-4 grid gap-1">
              {stack.map((app) => (
                <li key={app.id}>
                  <Link href={`/tools/${app.slug}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[var(--bg)]">
                    <ToolLogo src={app.logoUrl} name={app.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{app.name}</span>
                      <span className="block truncate text-xs text-[var(--muted)]">{app.tagline}</span>
                    </span>
                    <span aria-hidden className="text-[var(--faint)]">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <div className="rounded-[1.25rem] border border-dashed border-[var(--line-strong)] p-5 text-sm leading-6 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Got a better way?</span> Share your own stack and steps.
            <Link href="/flows/new" className="btn btn-outline btn-sm mt-3 w-full">
              + Create Flow
            </Link>
          </div>
        </aside>
      </div>

      <section className="container-page border-t border-[var(--line)] py-12 sm:py-14">
        <ReviewSection kind="flow" id={flow.id} name={flow.title} data={reviews} signedIn={Boolean(session)} isOwner={isAuthor} />
      </section>

      {more.length ? (
        <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]">
          <div className="container-page py-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-3xl">More {flow.category.name} flows</h2>
              <Link href={`/flows?category=${flow.category.slug}`} className="text-sm font-bold underline underline-offset-4">
                See all
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((item) => (
                <FlowCard key={item.id} flow={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function AppDot({ app }: { app: { name: string; logoUrl: string | null } }) {
  return app.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={app.logoUrl} alt="" className="h-6 w-6 rounded-full bg-white object-contain ring-1 ring-[var(--line)]" />
  ) : (
    <span aria-hidden className="font-display grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-soft)] text-[10px] text-[var(--accent-ink)]">
      {app.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
