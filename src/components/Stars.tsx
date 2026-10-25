const STAR = "M8 1.6l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.3l-3.9 2.1.9-4.3-3.2-3 4.3-.5L8 1.6Z";

/** Read-only 5-star display; partial stars are clipped so 4.5 shows four and a half. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`} role="img">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" className="absolute inset-0 text-[var(--line-strong)]">
              <path d={STAR} fill="currentColor" />
            </svg>
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" className="text-[#e0a800]">
                <path d={STAR} fill="currentColor" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Compact "★ 4.6 (12)" chip for cards. */
export function RatingBadge({ rating }: { rating: { avg: number; count: number } | null | undefined }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink)]" title={`${rating.avg.toFixed(1)} from ${rating.count} ${rating.count === 1 ? "review" : "reviews"}`}>
      <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" className="text-[#e0a800]">
        <path d={STAR} fill="currentColor" />
      </svg>
      {rating.avg.toFixed(1)}
      <span className="font-normal text-[var(--muted)]">({rating.count})</span>
    </span>
  );
}

export const STAR_PATH = STAR;
