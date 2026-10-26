import type { Prisma } from "@prisma/client";
import { FLOW_CARD } from "./flows";
import { prisma } from "./prisma";

/**
 * Ranking score shared by tools and flows.
 *
 *   score = 1·ln(1+visits) + 3·ln(1+saves) + 2·ln(1+reviews) + 2·(R̄ − 3.5) + 1.5·e^(−age/30d)
 *   R̄ (Bayesian rating) = (reviews·avg + 3·3.5) / (reviews + 3)
 *
 * - Logs give diminishing returns, so one viral listing can't bury everything else.
 * - A save is a stronger signal than a visit, and a review stronger still per person, but rarer.
 * - R̄ pulls a rating toward 3.5 until there are enough reviews: one 5★ review ≈ 3.9, ten ≈ 4.7.
 *   Unreviewed listings sit at the neutral 3.5, so they're neither rewarded nor punished.
 * - The freshness bump (worth ~1.5 on day one, ~0.2 after two months) gives new listings a chance.
 */
export const RANK = {
  visitWeight: 1,
  saveWeight: 3,
  reviewWeight: 2,
  ratingWeight: 2,
  priorReviews: 3,
  priorRating: 3.5,
  freshBoost: 1.5,
  freshDays: 30,
} as const;

export type RankStats = { visits: number; saves: number; reviews: number; avgRating: number | null };

const DAY = 24 * 60 * 60 * 1000;

export function bayesRating({ reviews, avgRating }: RankStats) {
  return (reviews * (avgRating ?? 0) + RANK.priorReviews * RANK.priorRating) / (reviews + RANK.priorReviews);
}

export function rankScore(stats: RankStats, createdAt: Date, now = Date.now()) {
  const ageDays = Math.max(0, (now - createdAt.getTime()) / DAY);
  const score =
    RANK.visitWeight * Math.log1p(stats.visits) +
    RANK.saveWeight * Math.log1p(stats.saves) +
    RANK.reviewWeight * Math.log1p(stats.reviews) +
    RANK.ratingWeight * (bayesRating(stats) - RANK.priorRating) +
    RANK.freshBoost * Math.exp(-ageDays / RANK.freshDays);
  return Math.round(score * 100) / 100;
}

/** What cards and boards show: the counts plus a rounded average (null when unreviewed). */
export type Ranked = { score: number; stats: RankStats; rating: { avg: number; count: number } | null };

function ranked(stats: RankStats, createdAt: Date): Ranked {
  return {
    score: rankScore(stats, createdAt),
    stats,
    rating: stats.reviews ? { avg: Math.round((stats.avgRating ?? 0) * 10) / 10, count: stats.reviews } : null,
  };
}

const byScore = <T extends Ranked>(a: T, b: T) => b.score - a.score;

/** Published tools with their ranking, best first. */
export async function rankedTools(where: Prisma.ToolWhereInput = {}) {
  const [tools, ratings] = await Promise.all([
    prisma.tool.findMany({
      where: { status: "PUBLISHED", ...where },
      include: {
        category: true,
        creator: true,
        screenshots: { orderBy: { sortOrder: "asc" }, take: 1 }, // boards show only the first
        _count: { select: { events: { where: { type: "OUTBOUND_CLICK" } }, savedBy: true, reviews: true } },
      },
    }),
    prisma.toolReview.groupBy({ by: ["toolId"], _avg: { rating: true } }),
  ]);
  const avg = new Map(ratings.map((row) => [row.toolId, row._avg.rating]));
  return tools
    .map((tool) => ({
      ...tool,
      ...ranked({ visits: tool._count.events, saves: tool._count.savedBy, reviews: tool._count.reviews, avgRating: avg.get(tool.id) ?? null }, tool.createdAt),
    }))
    .sort(byScore);
}

/** Flows with their ranking, best first. */
export async function rankedFlows(where: Prisma.FlowWhereInput = {}) {
  const [flows, ratings] = await Promise.all([
    prisma.flow.findMany({
      where,
      include: { ...FLOW_CARD, _count: { select: { steps: true, savedBy: true, reviews: true } } },
    }),
    prisma.flowReview.groupBy({ by: ["flowId"], _avg: { rating: true } }),
  ]);
  const avg = new Map(ratings.map((row) => [row.flowId, row._avg.rating]));
  return flows
    .map((flow) => ({
      ...flow,
      ...ranked({ visits: flow.visits, saves: flow._count.savedBy, reviews: flow._count.reviews, avgRating: avg.get(flow.id) ?? null }, flow.createdAt),
    }))
    .sort(byScore);
}

export type RankedTool = Awaited<ReturnType<typeof rankedTools>>[number];
export type RankedFlow = Awaited<ReturnType<typeof rankedFlows>>[number];
