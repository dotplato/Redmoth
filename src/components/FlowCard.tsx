import Link from "next/link";
import { FlowMark, StackRow } from "./FlowMark";
import { SaveButton } from "./SaveButton";
import { RatingBadge } from "./Stars";
import { Visits } from "./ToolCard";

export type FlowCardData = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  logoUrl: string | null;
  featured: boolean;
  visits: number;
  category: { name: string };
  author: { name: string };
  stack: { tool: { name: string; logoUrl: string | null } }[];
  _count: { steps: number };
  rating?: { avg: number; count: number } | null;
};

export function FlowCard({ flow, note }: { flow: FlowCardData; note?: string | null }) {
  const apps = flow.stack.map((item) => item.tool);
  return (
    <article className="card group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <FlowMark logoUrl={flow.logoUrl} title={flow.title} stack={apps} />
        <div className="flex items-center gap-2">
          {flow.featured ? <span className="tag-featured">Featured</span> : null}
          <SaveButton toolId={flow.id} name={flow.title} kind="flow" />
        </div>
      </div>

      <h3 className="mt-5 text-[17px] tracking-tight">
        <Link href={`/flows/${flow.slug}`} className="after:absolute after:inset-0 after:rounded-[1.25rem]">
          {flow.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{flow.summary}</p>
      {note ? (
        <p className="mt-4 flex gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-[13px] leading-5 text-[var(--ink-soft)]">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ink)]" />
          <span>
            <span className="font-bold text-[var(--ink)]">Why it fits: </span>
            {note}
          </span>
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="tag-price" style={{ "--tag-fg": "var(--ink)", "--tag-bg": "var(--accent-soft)" } as React.CSSProperties}>
          {flow._count.steps} steps
        </span>
        <RatingBadge rating={flow.rating} />
        <Visits count={flow.visits} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="eyebrow truncate">{flow.category.name}</span>
        <StackRow apps={apps} />
      </div>
    </article>
  );
}
