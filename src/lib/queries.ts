import type { Pricing } from "@prisma/client";
import { prisma } from "./prisma";

// Outbound Visit clicks per tool, shown on cards as "N users visited".
export const VISITS = { _count: { select: { events: { where: { type: "OUTBOUND_CLICK" as const } } } } };

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
    include: { category: true, creator: true, screenshots: { orderBy: { sortOrder: "asc" } }, ...VISITS },
    orderBy: ORDER[filters?.sort ?? "featured"],
  });
}

export async function featuredTools() {
  return prisma.tool.findMany({
    where: { status: "PUBLISHED", featured: true },
    include: { category: true, creator: true, screenshots: { orderBy: { sortOrder: "asc" } }, ...VISITS },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
}

export async function getToolBySlug(slug: string) {
  return prisma.tool.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      creator: true,
      screenshots: { orderBy: { sortOrder: "asc" } },
    },
  });
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
