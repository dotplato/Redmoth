import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowCard } from "@/components/FlowCard";
import { JsonLd } from "@/components/JsonLd";
import { ToolCard } from "@/components/ToolCard";
import { ToolLogo } from "@/components/ToolLogo";
import { ArrowUpRight } from "@/components/VisitButton";
import { getCreatorSession } from "@/lib/creator-auth";
import { FLOW_CARD } from "@/lib/flows";
import { hostname } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { VISITS } from "@/lib/queries";
import { NOINDEX, SITE_NAME, absoluteUrl, snippet } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const creator = await prisma.creator.findUnique({
    where: { slug: (await params).slug },
    include: { _count: { select: { tools: { where: { status: "PUBLISHED" } }, flows: true } } },
  });
  if (!creator) return { title: "Maker not found", ...NOINDEX };
  const empty = !creator._count.tools && !creator._count.flows;
  const description = snippet(
    `${creator.bio} ${creator._count.tools} AI ${creator._count.tools === 1 ? "tool" : "tools"} and ${creator._count.flows} ${creator._count.flows === 1 ? "flow" : "flows"} by ${creator.name} on ${SITE_NAME}.`,
  );
  return {
    title: `${creator.name} — AI tools and flows`,
    description,
    alternates: { canonical: `/creators/${creator.slug}` },
    openGraph: {
      type: "profile",
      url: `/creators/${creator.slug}`,
      title: `${creator.name} on ${SITE_NAME}`,
      description,
      ...(creator.avatarUrl ? { images: [{ url: creator.avatarUrl, alt: creator.name }] } : {}),
    },
    // Profiles with nothing public are thin pages.
    ...(empty ? NOINDEX : {}),
  };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const creator = await prisma.creator.findUnique({
    where: { slug },
    include: {
      tools: {
        where: { status: "PUBLISHED" },
        include: { category: true, ...VISITS },
        orderBy: { name: "asc" },
      },
      flows: { include: FLOW_CARD, orderBy: { createdAt: "desc" } },
    },
  });
  if (!creator) notFound();
  const isOwner = (await getCreatorSession())?.sub === creator.id;

  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: absoluteUrl(`/creators/${creator.slug}`),
          mainEntity: {
            "@type": "Organization",
            name: creator.name,
            description: creator.bio,
            ...(creator.avatarUrl ? { logo: absoluteUrl(creator.avatarUrl) } : {}),
            ...(creator.website ? { sameAs: [creator.website] } : {}),
          },
          hasPart: creator.tools.map((tool) => ({
            "@type": "SoftwareApplication",
            name: tool.name,
            url: absoluteUrl(`/tools/${tool.slug}`),
          })),
        }}
      />
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="paper-grain pointer-events-none absolute inset-0" />
        <div className="container-page relative py-14 sm:py-20">
          <Link href="/tools" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
            ← Discover
          </Link>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <ToolLogo src={creator.avatarUrl} name={creator.name} size="lg" />
            <div>
              <p className="eyebrow">Maker</p>
              <h1 className="font-display mt-2 text-5xl leading-none sm:text-6xl">{creator.name}</h1>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">{creator.bio}</p>
          <div className="mt-6 flex flex-wrap gap-2">
          {isOwner ? (
            <Link href="/account" className="btn btn-primary">
              Edit profile
            </Link>
          ) : null}
          {creator.website ? (
            <a
              href={creator.website}
              target="_blank"
              rel="noopener"
              className="btn btn-outline"
            >
              {hostname(creator.website)}
              <ArrowUpRight />
            </a>
          ) : null}
          </div>
        </div>
      </section>

      <section className="container-page py-12 pb-24">
        <p className="text-sm font-bold text-[var(--muted)]">
          {creator.tools.length} {creator.tools.length === 1 ? "tool" : "tools"} on ToolsMade
        </p>
        {creator.tools.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creator.tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-[var(--muted)]">
            No published tools yet.
            {isOwner ? (
              <>
                {" "}
                <Link href="/submit" className="font-bold text-[var(--ink)] underline underline-offset-4">
                  Submit your first app
                </Link>
              </>
            ) : null}
          </p>
        )}

        {creator.flows.length ? (
          <>
            <p className="mt-14 text-sm font-bold text-[var(--muted)]">
              {creator.flows.length} {creator.flows.length === 1 ? "flow" : "flows"} shared
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creator.flows.map((flow) => (
                <FlowCard key={flow.id} flow={flow} />
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
