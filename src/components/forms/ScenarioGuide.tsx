"use client";

import { useState } from "react";
import { EXAMPLE_SCENARIO, SCENARIO_STEPS, scenarioSteps, type ScenarioParts } from "@/lib/scenario";
import { ScenarioSteps } from "../ScenarioSteps";

/** Side box on the submit form: the Sara example, or a live preview of the maker's own four steps. */
export function ScenarioGuide({ draft }: { draft: ScenarioParts }) {
  const hasDraft = SCENARIO_STEPS.some((step) => draft[step.key]?.trim());
  const [view, setView] = useState<"example" | "preview">("example");
  const showing = view === "preview" && hasDraft ? "preview" : "example";

  // Same punctuation rules as the published "In practice" box, so the preview is exact.
  const filled = new Map(scenarioSteps(draft).map((step) => [step.key, step.text]));
  const steps = SCENARIO_STEPS.map((step) => {
    const own = filled.get(step.key);
    return showing === "example"
      ? { key: step.key, label: step.label, text: EXAMPLE_SCENARIO[step.key] }
      : { key: step.key, label: step.label, text: own || `[${step.label.toLowerCase()}]`, placeholder: !own };
  });

  return (
    <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{showing === "example" ? "What a great scenario looks like" : "How yours will look"}</p>
        <div className="flex rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-0.5 text-[11px] font-bold">
          {(["example", "preview"] as const).map((option) => (
            <button
              key={option}
              type="button"
              disabled={option === "preview" && !hasDraft}
              onClick={() => setView(option)}
              className={`rounded-full px-2.5 py-1 transition disabled:opacity-40 ${
                showing === option ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {option === "example" ? "Example" : "Your preview"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        {/* Key resets the step cycle when switching between the example and the preview. */}
        <ScenarioSteps key={showing} steps={steps} />
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--faint)]">
        This is exactly how the &ldquo;In practice&rdquo; box appears on your app&rsquo;s page.
      </p>
    </div>
  );
}
