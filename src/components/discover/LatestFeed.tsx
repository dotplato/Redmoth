"use client";

import { useState } from "react";
import { FlowCard, type FlowCardData } from "../FlowCard";
import { ToolCard, type ToolCardData } from "../ToolCard";

export type LatestItem =
  | { kind: "tool"; id: string; ago: string; tool: ToolCardData }
  | { kind: "flow"; id: string; ago: string; flow: FlowCardData };

const FILTERS = [
  { value: "all", label: "Everything" },
  { value: "tool", label: "Tools" },
  { value: "flow", label: "Flows" },
] as const;
const STEP = 6;

/** Newest tools and flows in one stream, filterable, revealed six at a time. */
export function LatestFeed({ items }: { items: LatestItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [shown, setShown] = useState(STEP);
  const list = filter === "all" ? items : items.filter((item) => item.kind === filter);

  return (
    <div>
      <div role="tablist" aria-label="Show" className="inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-1">
        {FILTERS.map((option) => {
          const count = option.value === "all" ? items.length : items.filter((item) => item.kind === option.value).length;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              onClick={() => {
                setFilter(option.value);
                setShown(STEP);
              }}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--ink)] aria-selected:bg-[var(--ink)] aria-selected:text-white"
            >
              {option.label}
              <span className="text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {list.length ? (
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, shown).map((item) => (
            <li key={item.id} className="flex flex-col">
              <p className="mb-2 flex items-center gap-2 px-1 text-xs text-[var(--muted)]">
                <span className={`rounded-full px-2 py-0.5 font-bold ${item.kind === "flow" ? "bg-[var(--ink)] text-[var(--accent)]" : "bg-[var(--accent-soft)] text-[var(--ink)]"}`}>
                  {item.kind === "flow" ? "Flow" : "Tool"}
                </span>
                Added {item.ago}
              </p>
              <div className="flex flex-1 [&>article]:flex-1">
                {item.kind === "tool" ? <ToolCard tool={item.tool} /> : <FlowCard flow={item.flow} />}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-[var(--muted)]">Nothing here yet.</p>
      )}

      {list.length > shown ? (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setShown((n) => n + STEP)} className="btn btn-outline">
            Show more ({list.length - shown})
          </button>
        </div>
      ) : null}
    </div>
  );
}
