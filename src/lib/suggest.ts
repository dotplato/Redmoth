import { prisma } from "./prisma";
import { rankedFlows, type RankedFlow } from "./ranking";

const DAY = 24 * 60 * 60 * 1000;
// Each saved app a flow uses is worth this much ranking score (up to 3 apps).
const SAVED_APP_BOOST = 2;

export type SuggestedFlow = RankedFlow & { reason: string | null };

/** Why a flow is worth a look, from its own numbers (used when nothing personal applies). */
export function flowReason(flow: RankedFlow) {
  if (flow.rating && flow.rating.count >= 2) return `Rated ${flow.rating.avg.toFixed(1)}★ by ${flow.rating.count} people`;
  if (flow.stats.saves >= 2) return `Saved by ${flow.stats.saves} people`;
  if (Date.now() - flow.createdAt.getTime() < 14 * DAY) return "New this fortnight";
  if (flow.stats.visits >= 10) return `${flow.stats.visits} visits`;
  return null;
}

/**
 * Ranked flows, personalised when we know the viewer: flows built on apps they saved move up and
 * say so ("Uses Notion, which you saved"), and their own flows are left out.
 */
export async function suggestedFlows(viewerId: string | null, limit = 10): Promise<SuggestedFlow[]> {
  const [flows, saved] = await Promise.all([
    rankedFlows(viewerId ? { authorId: { not: viewerId } } : {}),
    viewerId ? prisma.savedTool.findMany({ where: { creatorId: viewerId }, select: { toolId: true } }) : [],
  ]);
  const savedIds = new Set(saved.map((row) => row.toolId));

  return flows
    .map((flow) => {
      const matches = flow.stack.filter((item) => savedIds.has(item.tool.id)).map((item) => item.tool.name);
      const boost = Math.min(matches.length, 3) * SAVED_APP_BOOST;
      const reason = matches.length
        ? `Uses ${matches.slice(0, 2).join(" & ")}${matches.length > 2 ? ` +${matches.length - 2}` : ""}, which you saved`
        : flowReason(flow);
      return { flow: { ...flow, reason }, boosted: flow.score + boost };
    })
    .sort((a, b) => b.boosted - a.boosted)
    .slice(0, limit)
    .map((row) => row.flow);
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "today", "yesterday", "3 days ago", "2 weeks ago"… */
export function timeAgo(date: Date, now = Date.now()) {
  const days = Math.round((date.getTime() - now) / DAY);
  if (days > -7) return rtf.format(days, "day");
  if (days > -60) return rtf.format(Math.round(days / 7), "week");
  if (days > -365) return rtf.format(Math.round(days / 30), "month");
  return rtf.format(Math.round(days / 365), "year");
}
