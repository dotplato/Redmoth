import type { Metadata } from "next";
import Link from "next/link";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { JsonLd } from "@/components/JsonLd";
import { FilterLink, FilterNavProvider, FilterResults, FilterSearchForm } from "@/components/FilterNav";
import { Segmented } from "@/components/Segmented";
import { SearchIcon } from "@/components/SiteHeader";
import { ToolCard } from "@/components/ToolCard";
import { PRICING_OPTIONS, pricingFromSlug, pricingOption } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { categoriesWithCounts, publishedTools, type ToolSort } from "@/lib/queries";
import { NOINDEX, SITE_NAME, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = { q?: string; category?: string; pricing?: string; sort?: string };
type Props = { searchParams: Promise<Params> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const pricing = pricingOption(pricingFromSlug(params.pricing));
  const category = params.category
    ? await prisma.category.findUnique({ where: { slug: params.category }, select: { name: true, slug: true } })
    : null;
  const year = new Date().getFullYear();

  // One indexable landing page per category and per price model; every other combination points back to them.
  let title = `Best AI Tools Directory (${year})`;
  let description = `Browse every AI tool on ${SITE_NAME}. Filter by category and price — free, freemium, free trial or paid — and compare screenshots, reviews and real examples.`;
  let canonical = "/tools";
  if (category) {
    title = `Best ${category.name} AI Tools (${year})`;
    description = `The best ${category.name.toLowerCase()} AI tools, hand-picked and compared. See pricing, screenshots, reviews and real-world examples for each app.`;
    canonical = `/tools?category=${category.slug}`;
  } else if (pricing) {
    title = pricing.value === "FREE" ? `Best Free AI Tools (${year})` : `${pricing.label} AI Tools (${year})`;
    description = `${pricing.label} AI tools worth trying, with screenshots, reviews and real-world examples so you can pick the right one fast.`;
    canonical = `/tools?pricing=${pricing.slug}`;
  }
  const filteredBeyondLanding = Boolean(params.q || params.sort || (category && pricing));

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { url: canonical, title, description },
    ...(filteredBeyondLanding ? NOINDEX : {}),
  };
}

const PRICING = [
  { value: undefined, label: "All" },
  ...PRICING_OPTIONS.map((option) => ({ value: option.slug, label: option.label, color: option.color })),
];

const SORTS = [
  { value: undefined, label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "A–Z" },
] as const;

export default async function ToolsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, category } = params;
  const pricingValue = pricingFromSlug(params.pricing);
  const pricing = pricingValue ? params.pricing : undefined;
  const sort = params.sort === "newest" || params.sort === "name" ? (params.sort as ToolSort) : undefined;

  const [tools, categories, flowCount] = await Promise.all([
    publishedTools({ q, category, pricing: pricingValue, sort }),
    categoriesWithCounts(),
    prisma.flow.count(),
  ]);
  const active = categories.find((item) => item.slug === category);
  const total = categories.reduce((sum, item) => sum + item._count.tools, 0);
  const filtered = Boolean(q || category || pricing);

  // Builds a Discover URL that keeps the current filters and overrides the given ones.
  const href = (extra: Partial<Params>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ q, category, pricing, sort, ...extra })) if (value) next.set(key, value);
    const str = next.toString();
    return str ? `/tools?${str}` : "/tools";
  };

  return (
    <FilterNavProvider>
      <div>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: active ? `${active.name} AI tools` : "AI tools",
            numberOfItems: tools.length,
            itemListElement: tools.slice(0, 50).map((tool, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(`/tools/${tool.slug}`),
              name: tool.name,
            })),
          }}
        />
        <section className="border-b border-[var(--line)]">
          <div className="container-page pb-8 pt-8 sm:pt-10">
            <DiscoverTabs current="tools" tools={total} flows={flowCount} />
            <p className="eyebrow">Browse tools</p>
            <h1 className="mt-3 text-5xl leading-none sm:text-6xl">
              {active ? `${active.name} AI tools` : pricingValue ? `${pricingOption(pricingValue)?.label} AI tools` : "All AI tools"}
              <span className="text-[var(--faint)]"> · {tools.length}</span>
            </h1>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Search by name, then narrow by category, price or sort order. Open any tool for screenshots and
              a real-world example.
            </p>

            <FilterSearchForm
              action="/tools"
              buttonLabel="Search"
              className="mt-8 flex max-w-2xl items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 pl-5 focus-within:border-[var(--ink)]"
            >
              <SearchIcon className="shrink-0 text-[var(--faint)]" />
              <input
                name="q"
                defaultValue={q ?? ""}
                aria-label="Search tools"
                placeholder="Search tools"
                className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--faint)]"
              />
              {category ? <input type="hidden" name="category" value={category} /> : null}
              {pricing ? <input type="hidden" name="pricing" value={pricing} /> : null}
              {sort ? <input type="hidden" name="sort" value={sort} /> : null}
            </FilterSearchForm>
          </div>

          <div className="container-page">
            <nav aria-label="Categories" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-4">
              <FilterLink href={href({ category: undefined })} active={!category} param="category" className="chip">
                All <span className="chip-count">{total}</span>
              </FilterLink>
              {categories.map((item) => (
                <FilterLink key={item.id} href={href({ category: item.slug })} active={category === item.slug} param="category" className="chip">
                  {item.name}
                  <span className="chip-count">{item._count.tools}</span>
                </FilterLink>
              ))}
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] py-3">
              <Segmented label="Price" param="pricing" options={PRICING} current={pricing} href={(value) => href({ pricing: value })} />
              <Segmented label="Sort" param="sort" options={SORTS} current={sort} href={(value) => href({ sort: value })} />
            </div>
          </div>
        </section>

        <section className="container-page py-10 pb-24">
          <FilterResults>
            {filtered ? (
              <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                Showing {tools.length} {tools.length === 1 ? "tool" : "tools"}
                {q ? (
                  <>
                    {" "}
                    for <span className="font-bold text-[var(--ink)]">“{q}”</span>
                  </>
                ) : null}
                <FilterLink href={sort ? `/tools?sort=${sort}` : "/tools"} active={false} className="underline underline-offset-4 hover:text-[var(--ink)]">
                  Clear filters
                </FilterLink>
              </p>
            ) : null}

            {tools.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            ) : (
              <div className="card grid place-items-center px-6 py-20 text-center">
                <p className="font-display text-3xl">Nothing on this shelf.</p>
                <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
                  No tools match these filters. Try a broader search or a different price filter.
                </p>
                <Link href="/tools" className="btn btn-primary mt-6">
                  Reset filters
                </Link>
              </div>
            )}
          </FilterResults>
        </section>
      </div>
    </FilterNavProvider>
  );
}
