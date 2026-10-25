import { prisma } from "./prisma";

/** Apps and categories the Create Flow form picks from (most visited apps first). */
export async function flowFormOptions() {
  const [tools, categories] = await Promise.all([
    prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ events: { _count: "desc" } }, { name: "asc" }],
      select: { id: true, name: true, tagline: true, logoUrl: true, category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return {
    apps: tools.map(({ category, ...tool }) => ({ ...tool, category: category.name })),
    categories,
  };
}
