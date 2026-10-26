import Link from "next/link";
import { AiSearchBox } from "@/components/AiSearchBox";
import { DiscoverNav } from "@/components/discover/DiscoverNav";
import { LatestFeed, type LatestItem } from "@/components/discover/LatestFeed";
import { TopToolsBoard } from "@/components/discover/TopToolsBoard";
import { FlowCarousel } from "@/components/FlowCarousel";
import { SectionHead } from "@/components/SectionHead";
import { SpotlightSlider } from "@/components/SpotlightSlider";
import { getCreatorSession } from "@/lib/creator-auth";
import { hostname } from "@/lib/format";
import { rankedFlows, rankedTools } from "@/lib/ranking";
import { suggestedFlows, timeAgo } from "@/lib/suggest";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover Top AI Tools This Week",
  description: "The top-ranked AI tools, suggested workflows, this week's picks and the newest AI apps — updated as people visit, save and review them.",
  alternates: { canonical: "/discover" },
};

const SECTIONS = [
  { id: "top-tools", label: "Top tools" },
  { id: "suggested-flows", label: "Suggested flows" },
  { id: "spotlight", label: "Spotlight" },
  { id: "latest", label: "Latest" },
];
const LATEST = 24;

export default async function DiscoverPage() {
  // Only the suggestions depend on who's viewing; the rankings start loading right away.
  const sessionLoad = getCreatorSession();
  const [session, tools, flows, suggested] = await Promise.all([
    sessionLoad,
    rankedTools(),
    rankedFlows(),
    sessionLoad.then((viewer) => suggestedFlows(viewer?.sub ?? null)),
  ]);
  const personal = suggested.some((flow) => flow.reason?.endsWith("which you saved"));

  // Spotlight: admin-featured tools first, topped up with the best-ranked ones.
  const spotlight = [...tools.filter((tool) => tool.featured), ...tools.filter((tool) => !tool.featured)].slice(0, 5);

  const latest: LatestItem[] = [
    ...tools.map((tool) => ({ at: tool.createdAt, item: { kind: "tool" as const, id: tool.id, ago: timeAgo(tool.createdAt), tool } })),
    ...flows.map((flow) => ({ at: flow.createdAt, item: { kind: "flow" as const, id: flow.id, ago: timeAgo(flow.createdAt), flow } })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, LATEST)
    .map(({ item }) => item);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="glow pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-page relative grid items-end gap-8 py-12 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="eyebrow">
              {tools.length} tools · {flows.length} flows
            </p>
            <h1 className="mt-3 text-5xl leading-none sm:text-7xl">Discover</h1>
            <p className="mt-4 max-w-md text-lg leading-8 text-[var(--muted)]">
              What people visit, save and rate highest, plus flows picked for you and everything new.
            </p>
          </div>
          <div className="grid gap-3">
            <AiSearchBox />
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/tools" className="btn btn-outline btn-sm">
                Browse all tools
              </Link>
              <Link href="/flows" className="btn btn-outline btn-sm">
                Browse all flows
              </Link>
            </div>
          </div>
        </div>
      </section>

      <DiscoverNav sections={SECTIONS} />

      <section id="top-tools" className="container-page scroll-mt-32 py-14 sm:py-16">
        <SectionHead
          eyebrow="Leaderboard"
          title="Top tools"
          action={
            <Link href="/tools" className="btn btn-outline btn-sm">
              All tools
            </Link>
          }
        />
        <div className="mt-8">
          <TopToolsBoard
            tools={tools.map((tool) => ({
              id: tool.id,
              slug: tool.slug,
              name: tool.name,
              tagline: tool.tagline,
              logoUrl: tool.logoUrl,
              pricing: tool.pricing,
              category: { name: tool.category.name, slug: tool.category.slug },
              score: tool.score,
              stats: tool.stats,
              rating: tool.rating,
            }))}
          />
        </div>
      </section>

      <section id="suggested-flows" className="scroll-mt-32 border-y border-[var(--line)] bg-[var(--bg-deep)]">
        <div className="container-page py-14 sm:py-16">
          <SectionHead
            eyebrow={personal ? "Picked for you" : "Ranked by the community"}
            title="Suggested flows"
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Link href="/flows/new" className="btn btn-ghost btn-sm">
                  + Create Flow
                </Link>
                <Link href="/flows" className="btn btn-outline btn-sm">
                  All flows
                </Link>
              </div>
            }
          />
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            {personal
              ? "Flows built on apps you saved come first, then the community's favourites."
              : session
                ? "The community's favourites. Save a few apps and we'll suggest flows that use them."
                : "The community's favourites. Log in and save apps to get flows matched to you."}
          </p>
          <div className="mt-8">
            {suggested.length ? (
              <FlowCarousel label="Suggested flows" flows={suggested.map((flow, i) => ({ ...flow, rank: i + 1 }))} />
            ) : (
              <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[var(--muted)]">No flows to suggest yet. Share how you combine apps.</p>
                <Link href="/flows/new" className="btn btn-primary">
                  Create a Flow
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="spotlight" className="container-page scroll-mt-32 py-14 sm:py-16">
        <SectionHead eyebrow="Spotlight" title="This week’s picks" />
        <div className="mt-8">
          {spotlight.length ? (
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
          ) : (
            <p className="text-[var(--muted)]">Nothing in the spotlight yet.</p>
          )}
        </div>
      </section>

      <section id="latest" className="scroll-mt-32 border-t border-[var(--line)]">
        <div className="container-page py-14 pb-24 sm:py-16">
          <SectionHead eyebrow="Just added" title="Latest" />
          <div className="mt-8">
            <LatestFeed items={latest} />
          </div>
        </div>
      </section>
    </div>
  );
}
