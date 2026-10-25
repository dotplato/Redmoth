import type { Metadata } from "next";
import Link from "next/link";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { FlowCard } from "@/components/FlowCard";
import { Segmented } from "@/components/Segmented";
import { SearchIcon } from "@/components/SiteHeader";
import { flowCategoriesWithCounts, listFlows, type FlowSort } from "@/lib/flows";
import { prisma } from "@/lib/prisma";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = { q?: string; category?: string; sort?: string };
type Props = { searchParams: Promise<Params> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category
    ? await prisma.category.findUnique({ where: { slug: params.category }, select: { name: true, slug: true } })
    : null;
  const title = category ? `${category.name} AI Workflows & Tool Stacks` : "AI Workflows & Tool Stacks";
  const description = category
    ? `Step-by-step ${category.name.toLowerCase()} workflows that show which AI tools people combine and exactly how they use them.`
    : "Step-by-step AI workflows shared by makers: the stack of apps they use together and how each one fits in.";
  const canonical = category ? `/flows?category=${category.slug}` : "/flows";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { url: canonical, title, description },
    ...(params.q || params.sort ? NOINDEX : {}),
  };
}

const SORTS = [
  { value: undefined, label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most visited" },
] as const;

export default async function FlowsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, category } = params;
  const sort = params.sort === "newest" || params.sort === "popular" ? (params.sort as FlowSort) : undefined;

  const [flows, categories, toolCount] = await Promise.all([
    listFlows({ q, category, sort }),
    flowCategoriesWithCounts(),
    prisma.tool.count({ where: { status: "PUBLISHED" } }),
  ]);
  const total = categories.reduce((sum, item) => sum + item._count.flows, 0);
  const active = categories.find((item) => item.slug === category);
  // Only categories that have flows, plus the one being viewed.
  const chips = categories.filter((item) => item._count.flows > 0 || item.slug === category);
  const filtered = Boolean(q || category);

  const href = (extra: Partial<Params>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ q, category, sort, ...extra })) if (value) next.set(key, value);
    const str = next.toString();
    return str ? `/flows?${str}` : "/flows";
  };

  return (
    <div>
      <section className="border-b border-[var(--line)]">
        <div className="container-page pb-8 pt-8 sm:pt-10">
          <DiscoverTabs current="flows" tools={toolCount} flows={total} />
          <p className="eyebrow">Workflows from the community</p>
          <h1 className="mt-3 text-5xl leading-none sm:text-6xl">
            {active ? `${active.name} flows` : "Flows"}
            <span className="text-[var(--faint)]"> · {flows.length}</span>
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            Stacks of apps that work together, step by step. Follow one as-is, or create your own and share how you work.
          </p>

          <form
            action="/flows"
            className="mt-8 flex max-w-2xl items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 pl-5 focus-within:border-[var(--ink)]"
          >
            <SearchIcon className="shrink-0 text-[var(--faint)]" />
            <input
              name="q"
              defaultValue={q ?? ""}
              aria-label="Search flows"
              placeholder="Search flows or an app in them"
              className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--faint)]"
            />
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {sort ? <input type="hidden" name="sort" value={sort} /> : null}
            <button className="btn btn-primary">Search</button>
          </form>
        </div>

        <div className="container-page">
          <nav aria-label="Categories" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-4">
            <Link href={href({ category: undefined })} aria-current={!category ? "page" : undefined} className="chip">
              All <span className="chip-count">{total}</span>
            </Link>
            {chips.map((item) => (
              <Link
                key={item.id}
                href={href({ category: item.slug })}
                aria-current={category === item.slug ? "page" : undefined}
                className="chip"
              >
                {item.name}
                <span className="chip-count">{item._count.flows}</span>
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] py-3">
            <Segmented label="Sort" options={SORTS} current={sort} href={(value) => href({ sort: value })} />
          </div>
        </div>
      </section>

      <section className="container-page py-10 pb-24">
        {filtered ? (
          <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            Showing {flows.length} {flows.length === 1 ? "flow" : "flows"}
            {q ? (
              <>
                {" "}
                for <span className="font-bold text-[var(--ink)]">“{q}”</span>
              </>
            ) : null}
            <Link href={sort ? `/flows?sort=${sort}` : "/flows"} className="underline underline-offset-4 hover:text-[var(--ink)]">
              Clear filters
            </Link>
          </p>
        ) : null}

        {flows.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>
        ) : (
          <div className="card grid place-items-center px-6 py-20 text-center">
            <p className="font-display text-3xl">{filtered ? "No flows match." : "No flows yet."}</p>
            <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
              {filtered
                ? "Try a broader search or another category."
                : "Be the first: pick a few apps, describe how you use them together, and publish it."}
            </p>
            <Link href={filtered ? "/flows" : "/flows/new"} className="btn btn-primary mt-6">
              {filtered ? "Reset filters" : "Create a Flow"}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
