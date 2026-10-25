import Link from "next/link";
import { AiSearchBox } from "@/components/AiSearchBox";
import { AppNetwork } from "@/components/AppNetwork";
import { FlowCard } from "@/components/FlowCard";
import { JsonLd } from "@/components/JsonLd";
import { SectionHead } from "@/components/SectionHead";
import { SpotlightSlider } from "@/components/SpotlightSlider";
import { ToolCard } from "@/components/ToolCard";
import { hostname } from "@/lib/format";
import { HERO_SLOT_COUNT } from "@/lib/hero-slots";
import { prisma } from "@/lib/prisma";
import { categoryChips, featuredTools, publishedTools } from "@/lib/queries";
import { rankedFlows } from "@/lib/ranking";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [featured, tools, categories, flows] = await Promise.all([
    featuredTools(),
    publishedTools(),
    categoryChips(),
    rankedFlows(), // ranking score: visits, saves, reviews, rating, freshness
  ]);
  const topFlows = flows.slice(0, 6);
  // Featured tools lead the spotlight; top it up with other listings so it always has a few slides.
  const spotlight = [...featured, ...tools.filter((tool) => !featured.some((f) => f.id === tool.id))].slice(0, 4);
  const rest = [...tools].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const network = await heroNetwork(tools);

  return (
    <div>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: absoluteUrl("/"),
            description: SITE_DESCRIPTION,
            // Sitelinks search box: the catalog search accepts ?q=.
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/tools")}?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: absoluteUrl("/"),
            logo: absoluteUrl("/opengraph-image"),
          },
        ]}
      />
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="container-page relative flex max-w-5xl flex-col items-center pb-2 pt-10 text-center sm:pt-12">
          <p className="rise eyebrow flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            {tools.length.toLocaleString("en")} AI tools and workflows
          </p>
          <h1 className="rise font-display mt-5 text-[2.25rem] leading-[1.04] sm:text-6xl lg:text-[4.25rem]">
            No noise.
            <br /> <span className="text-[var(--accent)]">Just the right tool</span>
          </h1>
          <div className="rise mt-8 w-full max-w-2xl text-left" style={{ animationDelay: "120ms" }}>
            <AiSearchBox categories={categories} />
          </div>

        </div>

        {/* Outside the text column so the scene can stretch to both sides of the screen. */}
        <div className="rise relative px-4 pb-6" style={{ animationDelay: "200ms" }}>
          <AppNetwork apps={network} />
        </div>
      </section>

      {spotlight.length ? (
        <section id="featured" className="container-page scroll-mt-20 py-16 sm:py-20">
          <SectionHead
            eyebrow="Spotlight"
            title="This week’s picks"
            action={
              <Link href="/tools" className="btn btn-outline btn-sm">
                View all {tools.length}
              </Link>
            }
          />
          <div className="mt-8">
            <SpotlightSlider
              tools={spotlight.map((tool) => ({
                id: tool.id,
                slug: tool.slug,
                name: tool.name,
                tagline: tool.tagline,
                description: tool.description,
                logoUrl: tool.logoUrl,
                host: hostname(tool.websiteUrl),
                pricing: tool.pricing,
                category: { name: tool.category.name },
                creator: { name: tool.creator.name, slug: tool.creator.slug },
                screenshot: tool.screenshots[0] ? { imageUrl: tool.screenshots[0].imageUrl, alt: tool.screenshots[0].alt } : null,
              }))}
            />
          </div>
        </section>
      ) : (
        <div className="container-page py-24 text-center">
          <p className="font-display text-3xl">The shelves are empty — for now.</p>
          <p className="mt-2 text-[var(--muted)]">Publish a tool from the admin panel to see it here.</p>
        </div>
      )}

      <section className="border-y border-[var(--line)] bg-[var(--bg-deep)]">
        <div className="container-page py-16 sm:py-20">
          <SectionHead
            eyebrow="Flows"
            title="Top flows"
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Link href="/flows/new" className="btn btn-ghost btn-sm">
                  + Create Flow
                </Link>
                {flows.length ? (
                  <Link href="/flows" className="btn btn-outline btn-sm">
                    View all {flows.length}
                  </Link>
                ) : null}
              </div>
            }
          />
          <p className="mt-3 max-w-xl text-[var(--muted)]">Stacks of apps people use together, step by step.</p>
          {topFlows.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topFlows.map((flow) => (
                <FlowCard key={flow.id} flow={flow} />
              ))}
            </div>
          ) : (
            <div className="card mt-8 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-2xl">No flows yet.</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Share the apps you use together and how. Flows go live right away.</p>
              </div>
              <Link href="/flows/new" className="btn btn-primary">
                Create the first Flow
              </Link>
            </div>
          )}
        </div>
      </section>

      {rest.length ? (
        <section className="container-page py-16 pb-24 sm:py-20">
          <SectionHead
            eyebrow="Discover"
            title="Fresh on the shelf"
            action={
              <Link href="/tools" className="btn btn-outline btn-sm">
                View all {tools.length}
              </Link>
            }
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(0, 9).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Apps for the hero network, by slot. When an admin has curated slots (Admin → Hero), only those are shown
 * and the rest are "Your app here" placeholders; otherwise published apps fill the slots automatically.
 */
async function heroNetwork(tools: { id: string; name: string; slug: string; logoUrl: string | null }[]) {
  const toNode = (tool: { name: string; slug: string; logoUrl: string | null }) => ({ name: tool.name, slug: tool.slug, logoUrl: tool.logoUrl });
  const curated = await prisma.heroSlot.findMany({ include: { tool: true } });
  if (curated.length) {
    const slots: (ReturnType<typeof toNode> | null)[] = Array(HERO_SLOT_COUNT).fill(null);
    for (const slot of curated) {
      // Unpublished apps drop out of the hero until they're live again.
      if (slot.position < HERO_SLOT_COUNT && slot.tool.status === "PUBLISHED") slots[slot.position] = toNode(slot.tool);
    }
    return slots;
  }
  // Automatic: logos read best on the tiles, so apps that have one go first.
  return [...tools]
    .sort((a, b) => Number(Boolean(b.logoUrl)) - Number(Boolean(a.logoUrl)))
    .slice(0, HERO_SLOT_COUNT)
    .map(toNode);
}
