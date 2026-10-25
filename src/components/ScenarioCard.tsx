import { scenarioSteps, type ScenarioParts } from "@/lib/scenario";
import { ScenarioSteps } from "./ScenarioSteps";

/**
 * "In practice" box on the app page. Listings submitted with the four scenario steps get the same
 * interactive step view as the submit form; older single-paragraph scenarios show as plain text.
 */
export function ScenarioCard({ parts, text }: { parts: ScenarioParts; text: string | null }) {
  const steps = scenarioSteps(parts);
  if (!steps.length && !text) return null;

  return (
    <figure className="practice card relative overflow-hidden p-6 pl-7">
      <span aria-hidden className="practice-edge absolute inset-y-0 left-0 w-1.5" />
      <figcaption className="eyebrow flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)] ring-1 ring-[var(--ink)]" />
        </span>
        In practice
      </figcaption>
      <div className="mt-4">
        {steps.length ? (
          <ScenarioSteps steps={steps} />
        ) : (
          <blockquote className="whitespace-pre-line text-[15px] leading-7 text-[var(--ink)]">{text}</blockquote>
        )}
      </div>
    </figure>
  );
}
