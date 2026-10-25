"use client";

import { useEffect, useState } from "react";

export type ScenarioStep = { key: string; label: string; text: string; placeholder?: boolean };

/**
 * A scenario told in steps: numbered tabs above the paragraph, and the active step highlighted in yellow.
 * Cycles on its own until the reader hovers, clicks or focuses a step.
 */
export function ScenarioSteps({ steps, interval = 2600 }: { steps: ScenarioStep[]; interval?: number }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = Math.min(active, Math.max(steps.length - 1, 0));

  useEffect(() => {
    if (paused || steps.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((step) => (step + 1) % steps.length), interval);
    return () => clearInterval(id);
  }, [paused, steps.length, interval]);

  const pick = (index: number) => {
    setActive(index);
    setPaused(true);
  };

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Parts of the scenario">
        {steps.map((step, index) => (
          <button
            key={step.key}
            type="button"
            role="tab"
            aria-selected={current === index}
            onClick={() => pick(index)}
            onFocus={() => pick(index)}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
              current === index
                ? "bg-[var(--ink)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--line)] hover:text-[var(--ink)]"
            }`}
          >
            {index + 1}. {step.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
        {steps.map((step, index) => (
          <span key={step.key}>
            {index > 0 ? " " : null}
            <span
              onMouseEnter={() => setActive(index)}
              className={`cursor-default rounded transition-colors duration-300 ${
                current === index ? "bg-[var(--accent)] text-[var(--ink)]" : ""
              } ${step.placeholder ? "italic opacity-60" : ""}`}
            >
              {step.text}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}
