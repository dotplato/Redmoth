"use client";

import type { scoreListing } from "@/lib/listing-score";

type Result = ReturnType<typeof scoreListing>;

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function tone(score: number) {
  if (score >= 90) return { ring: "var(--ok)", text: "text-[var(--ok)]" };
  if (score >= 70) return { ring: "var(--ink)", text: "text-[var(--ink)]" };
  if (score >= 40) return { ring: "#d4a600", text: "text-[#8a6d00]" };
  return { ring: "var(--danger)", text: "text-[var(--danger)]" };
}

/** Sticky "listing score" panel beside the submit form: the gauge plus what to do next. */
export function ScoreMeter({ result }: { result: Result }) {
  const { score, level, nextSteps } = result;
  const colors = tone(score);

  return (
    <aside aria-label="Listing score" className="card p-6">
      <p className="eyebrow text-center">Listing score</p>
      <div className="relative mx-auto mt-4 h-[150px] w-[150px]">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--bg-deep)" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={colors.ring}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
            className="transition-[stroke-dashoffset,stroke] duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-5xl leading-none" aria-live="polite">
              {score}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--faint)]">of 100</p>
          </div>
        </div>
      </div>
      <p className={`mt-3 text-center text-lg font-bold ${colors.text}`}>{level}</p>

      <div className="mt-5 border-t border-[var(--line)] pt-4">
        {nextSteps.length ? (
          <>
            <p className="text-xs font-bold text-[var(--ink)]">How to improve</p>
            <ul className="mt-3 grid gap-2.5">
              {nextSteps.map((check) => (
                <li key={check.key} className="flex items-start gap-2.5 text-[13px] leading-5 text-[var(--ink-soft)]">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)] ring-1 ring-[var(--ink)]" />
                  <span className="flex-1">{check.tip}</span>
                  <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-1.5 text-xs font-bold text-[var(--ink)]">
                    +{check.max - check.points}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-center text-[13px] leading-5 text-[var(--ok)]">Nothing left to improve. This listing is complete.</p>
        )}
      </div>
    </aside>
  );
}

/** Compact version pinned to the bottom of small screens, where the side panel doesn't fit. */
export function ScorePill({ result }: { result: Result }) {
  const colors = tone(result.score);
  return (
    <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="card flex items-center gap-3 px-4 py-2.5 shadow-[var(--shadow-lg)]">
        <span className="font-display text-2xl leading-none">{result.score}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-deep)]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${result.score}%`, background: colors.ring }} />
        </div>
        <span className={`text-xs font-bold ${colors.text}`}>{result.level}</span>
      </div>
    </div>
  );
}

/** Small score chip for admin lists; hover shows what's missing. */
export function ScoreBadge({ score, level, missing = [] }: { score: number; level: string; missing?: string[] }) {
  const colors = tone(score);
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap"
      title={missing.length ? `${level} · To improve: ${missing.join(", ")}` : level}
    >
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--bg-deep)]" aria-hidden>
        <span className="block h-full rounded-full" style={{ width: `${score}%`, background: colors.ring }} />
      </span>
      <span className={`text-xs font-bold tabular-nums ${colors.text}`}>
        {score}
        <span className="sr-only"> / 100 listing score, {level}</span>
      </span>
    </span>
  );
}
