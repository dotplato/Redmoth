"use client";

import { useState } from "react";
import Link from "next/link";
import { PricingTag } from "../PricingTag";
import { SaveButton } from "../SaveButton";
import { RatingBadge } from "../Stars";
import { ToolLogo } from "../ToolLogo";

export type BoardTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  pricing: string;
  category: { name: string; slug: string };
  score: number;
  stats: { visits: number; saves: number; reviews: number };
  rating: { avg: number; count: number } | null;
};

const SHOWN = 10;
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** Ranked leaderboard: a podium for the top three, then a list, filterable by category. */
export function TopToolsBoard({ tools }: { tools: BoardTool[] }) {
  const [category, setCategory] = useState("all");
  const categories = [...new Map(tools.map((tool) => [tool.category.slug, tool.category.name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const list = (category === "all" ? tools : tools.filter((tool) => tool.category.slug === category)).slice(0, SHOWN);
  const top = list[0]?.score || 1;
  const podium = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter top tools by category" className="no-scrollbar -mx-1 flex max-w-full gap-2 overflow-x-auto px-1 py-1">
          {[["all", "All categories"] as const, ...categories].map(([slug, name]) => (
            <button
              key={slug}
              type="button"
              onClick={() => setCategory(slug)}
              aria-pressed={category === slug}
              className="chip shrink-0"
            >
              {name}
            </button>
          ))}
        </nav>
        <HowRanked />
      </div>

      {podium.length ? (
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {podium.map((tool, i) => (
            <li key={tool.id} className={i === 0 ? "md:order-2" : i === 1 ? "md:order-1 md:mt-8" : "md:order-3 md:mt-12"}>
              <article
                className={`group relative flex h-full flex-col rounded-[1.5rem] border p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] ${
                  i === 0 ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`font-display grid h-12 w-12 place-items-center rounded-2xl text-2xl ${
                      i === 0 ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--bg-deep)] text-[var(--ink)]"
                    }`}
                    aria-label={`Rank ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                  <SaveButton toolId={tool.id} name={tool.name} />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <ToolLogo src={tool.logoUrl} name={tool.name} />
                  <div className="min-w-0">
                    <h3 className="truncate text-xl">
                      <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0 after:rounded-[1.5rem]">
                        {tool.name}
                      </Link>
                    </h3>
                    <p className={`eyebrow truncate ${i === 0 ? "!text-white/60" : ""}`}>{tool.category.name}</p>
                  </div>
                </div>
                <p className={`mt-4 line-clamp-2 text-sm leading-6 ${i === 0 ? "text-white/75" : "text-[var(--muted)]"}`}>{tool.tagline}</p>
                <div className="mt-auto pt-6">
                  <Stats tool={tool} dark={i === 0} />
                  <ScoreBar score={tool.score} top={top} dark={i === 0} />
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-[var(--muted)]">No tools in this category yet.</p>
      )}

      {rest.length ? (
        <ol start={4} className="card mt-4 divide-y divide-[var(--line)] overflow-hidden">
          {rest.map((tool, i) => (
            <li key={tool.id} className="group relative flex items-center gap-4 px-4 py-3 transition hover:bg-[var(--bg)] sm:px-5">
              <span className="font-display w-7 shrink-0 text-center text-lg text-[var(--faint)] group-hover:text-[var(--ink)]">{i + 4}</span>
              <ToolLogo src={tool.logoUrl} name={tool.name} size="sm" />
              <div className="min-w-0 flex-1">
                <Link href={`/tools/${tool.slug}`} className="block truncate font-bold after:absolute after:inset-0">
                  {tool.name}
                </Link>
                <p className="truncate text-xs text-[var(--muted)]">{tool.tagline}</p>
              </div>
              <span className="hidden md:block">
                <PricingTag pricing={tool.pricing} />
              </span>
              <span className="hidden w-64 sm:block">
                <Stats tool={tool} />
              </span>
              <span className="hidden w-24 lg:block">
                <ScoreBar score={tool.score} top={top} />
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function Stats({ tool, dark = false }: { tool: BoardTool; dark?: boolean }) {
  const muted = dark ? "text-white/65" : "text-[var(--muted)]";
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${muted}`}>
      {tool.rating ? (
        <span className={dark ? "[&_*]:!text-white" : ""}>
          <RatingBadge rating={tool.rating} />
        </span>
      ) : (
        <span>No reviews</span>
      )}
      <span title="Visits">{compact.format(tool.stats.visits)} visits</span>
      <span title="Saves">{compact.format(tool.stats.saves)} saves</span>
    </div>
  );
}

function ScoreBar({ score, top, dark = false }: { score: number; top: number; dark?: boolean }) {
  return (
    <div className="mt-3 flex items-center gap-2" title={`Ranking score ${score.toFixed(1)}`}>
      <span className={`h-1.5 flex-1 overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-[var(--bg-deep)]"}`}>
        <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(6, (score / top) * 100)}%` }} />
      </span>
      <span className={`w-8 text-right text-[11px] font-bold tabular-nums ${dark ? "text-white/70" : "text-[var(--muted)]"}`}>{score.toFixed(1)}</span>
    </div>
  );
}

/** Small disclosure that explains the score in plain words. */
export function HowRanked() {
  return (
    <details className="group relative text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 font-bold text-[var(--muted)] hover:text-[var(--ink)] [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full border border-current text-[11px]">
          ?
        </span>
        How ranking works
      </summary>
      <div className="card absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] p-4 text-[13px] leading-6 text-[var(--ink-soft)] shadow-[var(--shadow-lg)]">
        <p className="font-bold text-[var(--ink)]">Score = visits + saves + reviews + rating + freshness</p>
        <ul className="mt-2 grid gap-1">
          <li>• Visits count once, saves count 3×, reviews 2×, each with diminishing returns.</li>
          <li>• Ratings are averaged with a neutral 3.5★ until there are enough reviews, so one 5★ can&rsquo;t top the chart.</li>
          <li>• New listings get a small boost that fades over a month or two.</li>
        </ul>
      </div>
    </details>
  );
}
