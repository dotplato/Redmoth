import Link from "next/link";
import { PricingTag } from "./PricingTag";
import { SaveButton } from "./SaveButton";
import { RatingBadge } from "./Stars";
import { ToolLogo } from "./ToolLogo";
import { VisitButton } from "./VisitButton";

export type ToolCardData = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logoUrl: string | null;
  category: { name: string };
  featured?: boolean;
  pricing?: string;
  _count?: { events: number };
  /** Average review rating, when the listing has reviews (ranked queries provide it). */
  rating?: { avg: number; count: number } | null;
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function ToolCard({ tool, note }: { tool: ToolCardData; note?: string | null }) {
  return (
    <article className="card group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <ToolLogo src={tool.logoUrl} name={tool.name} />
        <div className="flex items-center gap-2">
          {tool.featured ? <span className="tag-featured">Featured</span> : null}
          <SaveButton toolId={tool.id} name={tool.name} />
        </div>
      </div>

      <h3 className="mt-5 text-[17px] tracking-tight">
        {/* Stretched link: the whole card opens the detail page, while Visit stays its own target. */}
        <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0 after:rounded-[1.25rem]">
          {tool.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{tool.tagline}</p>
      {note ? (
        <p className="mt-4 flex gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-[13px] leading-5 text-[var(--ink-soft)]">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ink)]" />
          <span>
            <span className="font-bold text-[var(--ink)]">Why it fits: </span>
            {note}
          </span>
        </p>
      ) : null}
      {tool.pricing || tool._count || tool.rating ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <PricingTag pricing={tool.pricing} />
          <RatingBadge rating={tool.rating} />
          {tool._count ? <Visits count={tool._count.events} /> : null}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="eyebrow truncate">{tool.category.name}</span>
        <VisitButton slug={tool.slug} size="sm" variant="outline" className="relative z-10" />
      </div>
    </article>
  );
}

export function Visits({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
      <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="6" cy="5" r="2.5" />
        <path d="M1.5 13.5c.5-2.4 2.3-3.75 4.5-3.75s4 1.35 4.5 3.75M11 3a2.4 2.4 0 0 1 0 4.4M12.5 10.2c1.1.5 1.8 1.6 2 3.3" />
      </svg>
      {count === 0 ? "Be the first to visit" : `${compact.format(count)} ${count === 1 ? "user" : "users"} visited`}
    </span>
  );
}
