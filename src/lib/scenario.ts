/** The four parts of a great example scenario, shared by the submit form, admin editor and app page. */
export const SCENARIO_STEPS = [
  {
    key: "scenarioUser",
    label: "Real user",
    hint: "Who is it? Name a person and their role.",
    placeholder: "e.g. Sara runs operations for a 15-person online store",
  },
  {
    key: "scenarioProblem",
    label: "Problem",
    hint: "What was slowing them down?",
    placeholder: "e.g. She spends hours each week answering “where’s my order?” emails.",
  },
  {
    key: "scenarioHow",
    label: "How it helps",
    hint: "What do they do with your app?",
    placeholder: "e.g. She connects our app to Shopify and Gmail in 10 minutes. It now answers order questions automatically.",
  },
  {
    key: "scenarioResult",
    label: "Result",
    hint: "The outcome, ideally with a number.",
    placeholder: "e.g. Her team saves about 15 hours a week for $49/month.",
  },
] as const;

export type ScenarioKey = (typeof SCENARIO_STEPS)[number]["key"];
export type ScenarioParts = Partial<Record<ScenarioKey, string | null>>;

/** The built-in example shown while makers write their own. */
export const EXAMPLE_SCENARIO: Record<ScenarioKey, string> = {
  scenarioUser: "Sara runs operations for a 15-person online store",
  scenarioProblem: "and spends hours each week answering “where’s my order?” emails.",
  scenarioHow:
    "She connects our app to Shopify and Gmail in 10 minutes. It now answers order-status and return questions automatically and drafts replies for the rest,",
  scenarioResult: "saving her team about 15 hours a week for $49/month.",
};

/** Steps that have text, in order, ready for the interactive scenario view. */
export function scenarioSteps(parts: ScenarioParts) {
  const steps = SCENARIO_STEPS.flatMap((step) => {
    const text = parts[step.key]?.trim();
    return text ? [{ key: step.key, label: step.label, text }] : [];
  });
  // Close a step with a full stop when the next one starts a new sentence (or it's the last step),
  // but leave it open when the next step continues mid-sentence ("…store" + "and spends…").
  return steps.map((step, index) => {
    const next = steps[index + 1]?.text;
    const ended = /[.!?…:;,"”’)]$/.test(step.text);
    return ended || (next && !/^[A-Z“"]/.test(next)) ? step : { ...step, text: `${step.text}.` };
  });
}

/**
 * When the admin edits any structured step, rebuild the stored paragraph from the steps.
 * Otherwise leave `exampleScenario` as sent, so older single-paragraph listings keep their text.
 */
export function withScenario(parts: ScenarioParts & { exampleScenario?: string | null }) {
  const hasSteps = SCENARIO_STEPS.some((step) => parts[step.key]?.trim());
  return hasSteps ? { exampleScenario: joinScenario(parts) } : {};
}

/** The single paragraph stored in `exampleScenario` (used by search, compare and older listings). */
export function joinScenario(parts: ScenarioParts) {
  return scenarioSteps(parts).map((step) => step.text).join(" ") || null;
}
