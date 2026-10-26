import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowCarousel } from "@/components/FlowCarousel";
import { JsonLd } from "@/components/JsonLd";
import { PricingTag } from "@/components/PricingTag";
import { ReviewSection } from "@/components/ReviewSection";
import { SaveButton } from "@/components/SaveButton";
import { ScenarioCard } from "@/components/ScenarioCard";
import { ScreenshotRail } from "@/components/ScreenshotRail";
import { CompareJumpButton, SimilarApps } from "@/components/SimilarApps";
import { ToolLogo } from "@/components/ToolLogo";
import { VisitButton } from "@/components/VisitButton";
import { track } from "@/lib/analytics";
import { getCreatorSession } from "@/lib/creator-auth";
import { hostname } from "@/lib/format";
import { parseKeywords } from "@/lib/keywords";
import { pricingOption } from "@/lib/pricing";
import { getToolBySlug, publishedTools } from "@/lib/queries";
import { rankedFlows } from "@/lib/ranking";
import { loadReviews } from "@/lib/reviews";
import { NOINDEX, absoluteUrl, breadcrumbs, pricingOffer, snippet } from "@/lib/seo";
import { flowReason } from "@/lib/suggest";

export const dynamic = "force-dynamic";

const SIMILAR_LIMIT = 5;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tool = await getToolBySlug((await params).slug);
  if (!tool) return { title: "Tool not found", ...NOINDEX };
  const pricing = pricingOption(tool.pricing)?.label;
  const title = `${tool.name}: ${tool.tagline}`;
  const description = snippet(
    `${tool.description} ${pricing ? `${pricing}.` : ""} See screenshots, reviews, real-world examples and alternatives to ${tool.name}.`,
  );
  const image = tool.screenshots[0]?.imageUrl ?? tool.logoUrl;
  const keywords = parseKeywords(tool.seoKeywords);
  return {
    title,
    description,
    ...(keywords.length ? { keywords } : {}),
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      type: "website",
      url: `/tools/${tool.slug}`,
      title: `${tool.name} — ${tool.tagline}`,
      description,
      ...(image ? { images: [{ url: image, alt: tool.screenshots[0]?.alt ?? `${tool.name} logo` }] } : {}),
    },
    twitter: { card: "summary_large_image", title: `${tool.name} — ${tool.tagline}`, description },
  };
}

function toolJsonLd(
  tool: NonNullable<Awaited<ReturnType<typeof getToolBySlug>>>,
  reviews: Awaited<ReturnType<typeof loadReviews>>,
) {
  const offer = pricingOffer(tool.pricing);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    url: absoluteUrl(`/tools/${tool.slug}`),
    sameAs: tool.websiteUrl,
    applicationCategory: tool.category.name,
    operatingSystem: "Web",
    ...(tool.logoUrl ? { image: absoluteUrl(tool.logoUrl) } : {}),
    ...(tool.screenshots.length ? { screenshot: tool.screenshots.map((shot) => absoluteUrl(shot.imageUrl)) } : {}),
    ...(tool.releaseDate ? { datePublished: tool.releaseDate.toISOString().slice(0, 10) } : {}),
    author: { "@type": "Organization", name: tool.creator.name, url: absoluteUrl(`/creators/${tool.creator.slug}`) },
    ...(offer ? { offers: offer } : {}),
    ...(reviews.count
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.avg, ratingCount: reviews.count, bestRating: 5, worstRating: 1 },
          review: reviews.reviews.slice(0, 5).map((review) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
            author: { "@type": "Person", name: review.author.name },
            datePublished: review.createdAt.slice(0, 10),
            ...(review.body ? { reviewBody: review.body } : {}),
          })),
        }
      : {}),
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  await track(tool.id, "DETAIL_VIEW");
  const session = await getCreatorSession();
  const viewerId = session?.sub ?? null;
  const [flows, reviews] = await Promise.all([
    // Best-ranked flows that have this app in their stack.
    rankedFlows({ stack: { some: { toolId: tool.id } } }),
    loadReviews("tool", tool.id, viewerId),
  ]);

  // Same category first, then the rest of the catalog, so there is always something to compare with.
  const others = (await publishedTools()).filter((item) => item.id !== tool.id);
  const similar = [
    ...others.filter((item) => item.categoryId === tool.categoryId),
    ...others.filter((item) => item.categoryId !== tool.categoryId),
  ].slice(0, SIMILAR_LIMIT);

  return (
    <div>
      <JsonLd
        data={[
          toolJsonLd(tool, reviews),
          breadcrumbs([
            { name: "Tools", path: "/tools" },
            { name: tool.category.name, path: `/tools?category=${tool.category.slug}` },
            { name: tool.name, path: `/tools/${tool.slug}` },
          ]),
        ]}
      />
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="glow pointer-events-none absolute inset-0 opacity-70" />
        <div className="container-page relative pb-10 pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Link href="/tools" className="hover:text-[var(--ink)]">
              Tools
            </Link>
            <span className="text-[var(--line-strong)]">/</span>
            <Link href={`/tools?category=${tool.category.slug}`} className="hover:text-[var(--ink)]">
              {tool.category.name}
            </Link>
          </nav>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <ToolLogo src={tool.logoUrl} name={tool.name} size="lg" />
              <div className="min-w-0">
                <h1 className="text-5xl leading-none sm:text-6xl">{tool.name}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-7 text-[var(--ink-soft)]">{tool.tagline}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                  <span>
                    by{" "}
                    <Link
                      href={`/creators/${tool.creator.slug}`}
                      className="font-bold text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--ink)]"
                    >
                      {tool.creator.name}
                    </Link>
                  </span>
                  <span className="eyebrow rounded-full border border-[var(--line-strong)] px-2.5 py-1">
                    {tool.category.name}
                  </span>
                  {tool.releaseDate ? (
                    <span>
                      Released{" "}
                      {tool.releaseDate.toLocaleDateString("en", { month: "short", year: "numeric", timeZone: "UTC" })}
                    </span>
                  ) : null}
                  <PricingTag pricing={tool.pricing} />
                  {tool.featured ? <span className="tag-featured">Featured</span> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex flex-wrap gap-2">
                <VisitButton slug={tool.slug} label="Visit website" variant="accent" size="lg" />
                <CompareJumpButton />
                <SaveButton toolId={tool.id} name={tool.name} variant="full" />
              </div>
              <span className="text-xs text-[var(--faint)]">{hostname(tool.websiteUrl)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pt-10">
        <ScreenshotRail shots={tool.screenshots} />
      </section>

      <div className="container-page grid grid-cols-[minmax(0,1fr)] items-start gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <article className="min-w-0">
          <p className="eyebrow">About</p>
          <p className="mt-3 text-xl font-bold leading-8 text-[var(--ink)] sm:text-2xl sm:leading-9">{tool.description}</p>
          <div className="prose-body mt-8 max-w-[65ch] whitespace-pre-line text-[15.5px] leading-7 text-[var(--ink-soft)]">
            {tool.body}
          </div>
        </article>

        <aside className="grid gap-5">
          <ScenarioCard parts={tool} text={tool.exampleScenario} />
          <SimilarApps
            current={{ slug: tool.slug, name: tool.name }}
            apps={similar.map((item) => ({
              slug: item.slug,
              name: item.name,
              tagline: item.tagline,
              logoUrl: item.logoUrl,
            }))}
          />
        </aside>
      </div>

      <section aria-labelledby="tool-flows" className="border-t border-[var(--line)] bg-[var(--bg-deep)]">
        <div className="container-page py-12 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Suggested flows</p>
              <h2 id="tool-flows" className="mt-2 text-3xl sm:text-4xl">
                Flows with {tool.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {flows.length
                  ? `How people use ${tool.name} together with other apps, best ranked first.`
                  : `No one has shared a flow with ${tool.name} yet.`}
              </p>
            </div>
            <Link href={`/flows/new?with=${tool.id}`} className="btn btn-outline btn-sm">
              + Create a flow with {tool.name}
            </Link>
          </div>
          {flows.length ? (
            <div className="mt-8">
              <FlowCarousel
                label={`Flows with ${tool.name}`}
                flows={flows.slice(0, 12).map((flow, i) => ({ ...flow, rank: i + 1, reason: flowReason(flow) }))}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="container-page border-t border-[var(--line)] py-12 sm:py-14">
        <ReviewSection
          kind="tool"
          id={tool.id}
          name={tool.name}
          data={reviews}
          signedIn={Boolean(viewerId)}
          isOwner={Boolean(viewerId) && (tool.creatorId === viewerId || tool.submittedById === viewerId)}
        />
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]">
        <div className="container-page grid gap-4 py-10 md:grid-cols-[1.4fr_1fr]">
          <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <ToolLogo src={tool.creator.avatarUrl} name={tool.creator.name} />
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Made by</p>
              <p className="mt-1 font-bold">{tool.creator.name}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{tool.creator.bio}</p>
            </div>
            <Link href={`/creators/${tool.creator.slug}`} className="btn btn-outline btn-sm shrink-0">
              More from {tool.creator.name}
            </Link>
          </div>
          <div className="rounded-[1.25rem] border border-dashed border-[var(--line-strong)] p-6 text-sm leading-6 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Always free to list.</span> Visit opens{" "}
            <span className="text-xs">{hostname(tool.websiteUrl)}</span>. Some Visit links are affiliate links, which
            help keep redmoth free and never change the price you pay.
          </div>
        </div>
      </section>
    </div>
  );
}
