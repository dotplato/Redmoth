import { prisma } from "./prisma";

export type ReviewKind = "tool" | "flow";

export type ReviewView = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  author: { name: string; slug: string; avatarUrl: string | null };
  mine: boolean;
};

/** Everything a review section needs: summary, star histogram, newest reviews, and the viewer's own. */
export async function loadReviews(kind: ReviewKind, id: string, viewerId: string | null) {
  const include = { creator: { select: { name: true, slug: true, avatarUrl: true } } };
  const rows =
    kind === "tool"
      ? await prisma.toolReview.findMany({ where: { toolId: id }, include, orderBy: { updatedAt: "desc" } })
      : await prisma.flowReview.findMany({ where: { flowId: id }, include, orderBy: { updatedAt: "desc" } });

  const reviews: ReviewView[] = rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    body: row.body,
    createdAt: row.updatedAt.toISOString(),
    author: row.creator,
    mine: row.creatorId === viewerId,
  }));
  const count = reviews.length;
  const avg = count ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;
  const histogram = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((review) => review.rating === stars).length }));
  return { reviews, count, avg: Math.round(avg * 10) / 10, histogram, mine: reviews.find((review) => review.mine) ?? null };
}
