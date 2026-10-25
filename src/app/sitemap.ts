import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PRICING_OPTIONS } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/seo";

// Listings change whenever an admin publishes, so build it per request.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tools, flows, creators, categories] = await Promise.all([
    prisma.tool.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true, pricing: true } }),
    prisma.flow.findMany({ select: { slug: true, updatedAt: true } }),
    // Only makers with something public to show.
    prisma.creator.findMany({
      where: { OR: [{ tools: { some: { status: "PUBLISHED" } } }, { flows: { some: {} } }] },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      select: {
        slug: true,
        _count: { select: { tools: { where: { status: "PUBLISHED" } }, flows: true } },
      },
    }),
  ]);
  const latest = tools.reduce((max, tool) => (tool.updatedAt > max ? tool.updatedAt : max), new Date(0));
  const now = latest.getTime() ? latest : new Date();

  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/tools"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/discover"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/flows"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/submit"), changeFrequency: "monthly", priority: 0.4 },
    ...categories
      .filter((category) => category._count.tools > 0)
      .map((category) => ({
        url: absoluteUrl(`/tools?category=${category.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...categories
      .filter((category) => category._count.flows > 0)
      .map((category) => ({
        url: absoluteUrl(`/flows?category=${category.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ...PRICING_OPTIONS.filter((option) => tools.some((tool) => tool.pricing === option.value)).map((option) => ({
      url: absoluteUrl(`/tools?pricing=${option.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...tools.map((tool) => ({
      url: absoluteUrl(`/tools/${tool.slug}`),
      lastModified: tool.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...flows.map((flow) => ({
      url: absoluteUrl(`/flows/${flow.slug}`),
      lastModified: flow.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...creators.map((creator) => ({
      url: absoluteUrl(`/creators/${creator.slug}`),
      lastModified: creator.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
