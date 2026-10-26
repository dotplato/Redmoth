import type { Pricing } from "@prisma/client";
import { cache } from "react";
import { prisma } from "./prisma";

// Outbound Visit clicks per tool, shown on cards as "N users visited".
export const VISITS = { _count: { select: { events: { where: { type: "OUTBOUND_CLICK" as const } } } } };

// Listings only ever show a tool's first screenshot (spotlight cards), so don't load the rest.
const FIRST_SCREENSHOT = { screenshots: { orderBy: { sortOrder: "asc" as const }, take: 1 } };

export type ToolSort = "featured" | "newest" | "name";

const ORDER = {
  featured: [{ featured: "desc" as const }, { name: "asc" as const }],
  newest: [{ createdAt: "desc" as const }],
  name: [{ name: "asc" as const }],
};

export async function publishedTools(filters?: {
  q?: string;
  category?: string;
  pricing?: Pricing;
  sort?: ToolSort;
}) {
  return prisma.tool.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters?.category ? { category: { slug: filters.category } } : {}),
      ...(filters?.pricing ? { pricing: filters.pricing } : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { tagline: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
              { seoKeywords: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { category: true, creator: true, ...FIRST_SCREENSHOT, ...VISITS },
    orderBy: ORDER[filters?.sort ?? "featured"],
  });
}

export async function featuredTools() {
  return prisma.tool.findMany({
    where: { status: "PUBLISHED", featured: true },
    include: { category: true, creator: true, ...FIRST_SCREENSHOT, ...VISITS },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
}

/** Cached per request: the page and its generateMetadata share one query. */
export const getToolBySlug = cache(async (slug: string) => {
  return prisma.tool.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      creator: true,
      screenshots: { orderBy: { sortOrder: "asc" } },
    },
  });
});

/** Up to `limit` other published tools: same category first, then the rest of the catalog. */
export async function similarTools(tool: { id: string; categoryId: string }, limit: number) {
  const select = { id: true, slug: true, name: true, tagline: true, logoUrl: true };
  const where = { status: "PUBLISHED" as const, id: { not: tool.id } };
  const [sameCategory, others] = await Promise.all([
    prisma.tool.findMany({ where: { ...where, categoryId: tool.categoryId }, select, orderBy: ORDER.featured, take: limit }),
    prisma.tool.findMany({ where: { ...where, categoryId: { not: tool.categoryId } }, select, orderBy: ORDER.featured, take: limit }),
  ]);
  return [...sameCategory, ...others].slice(0, limit);
}

/** Categories that have at least one published tool, shaped for the chip row under the search box. */
export async function categoryChips() {
  const categories = await categoriesWithCounts();
  return categories
    .filter((item) => item._count.tools > 0)
    .map((item) => ({ id: item.id, name: item.name, slug: item.slug, count: item._count.tools }));
}

export async function categoriesWithCounts() {
  return prisma.category.findMany({
    include: {
      _count: { select: { tools: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: { name: "asc" },
  });
}
