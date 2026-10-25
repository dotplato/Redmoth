import { NO_COST_TO_START } from "./pricing";
import { SCENARIO_STEPS, type ScenarioKey } from "./scenario";

export type ListingInputs = {
  name: string;
  tagline: string;
  websiteUrl: string;
  categoryId: string;
  hasLogo: boolean;
  description: string;
  body: string;
  scenario: Record<ScenarioKey, string>;
  screenshots: number;
  releaseDate: string;
  pricing: string;
  affiliate: boolean | null;
  affiliateUrl: string;
};

export type ScoreCheck = { key: string; label: string; points: number; max: number; tip: string };

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const isUrl = (text: string) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(text.trim());

/** How complete and convincing a listing is, out of 100. Mirrors what makes listings get clicked. */
export function scoreListing(input: ListingInputs) {
  const taglineWords = words(input.tagline);
  const stepsDone = SCENARIO_STEPS.filter((step) => input.scenario[step.key].trim().length >= 15).length;
  const resultHasNumber = /\d/.test(input.scenario.scenarioResult);

  const checks: ScoreCheck[] = [
    {
      key: "basics",
      label: "Name & tagline",
      max: 10,
      points: (input.name.trim().length >= 2 ? 4 : 0) + (taglineWords >= 4 && taglineWords <= 10 ? 6 : taglineWords > 0 ? 3 : 0),
      tip: "Add a 4–10 word tagline",
    },
    { key: "website", label: "Website link", max: 5, points: isUrl(input.websiteUrl) ? 5 : 0, tip: "Add your full website URL" },
    { key: "category", label: "Category", max: 5, points: input.categoryId ? 5 : 0, tip: "Pick a category" },
    { key: "logo", label: "Logo", max: 10, points: input.hasLogo ? 10 : 0, tip: "Upload a square logo" },
    {
      key: "description",
      label: "Short description",
      max: 10,
      points: input.description.trim().length >= 60 ? 10 : input.description.trim().length >= 20 ? 5 : 0,
      tip: "Write a 1–2 sentence description (60+ characters)",
    },
    {
      key: "body",
      label: "Details",
      max: 10,
      points: input.body.trim().length >= 250 ? 10 : input.body.trim().length >= 80 ? 5 : 0,
      tip: "Describe features, use cases and pricing (250+ characters)",
    },
    {
      key: "scenario",
      label: "Example scenario",
      max: 20,
      points: stepsDone * 4 + (resultHasNumber ? 4 : 0),
      tip: stepsDone < 4 ? `Complete all 4 scenario steps (${stepsDone}/4)` : "Put a number in the result (hours saved, $ cost…)",
    },
    {
      key: "screenshots",
      label: "Screenshots",
      max: 15,
      points: input.screenshots >= 3 ? 15 : input.screenshots === 2 ? 10 : input.screenshots === 1 ? 6 : 0,
      tip: input.screenshots ? `Add ${3 - input.screenshots} more in-app screenshot${input.screenshots === 2 ? "" : "s"}` : "Add in-app screenshots (3 is ideal)",
    },
    {
      key: "pricing",
      label: "Pricing",
      max: 5,
      points: input.pricing ? 3 + ((NO_COST_TO_START as string[]).includes(input.pricing) ? 2 : 0) : 0,
      tip: input.pricing ? "A free plan or free trial lowers the barrier to try" : "Choose a pricing model",
    },
    {
      key: "affiliate",
      label: "Affiliate program",
      max: 5,
      points: input.affiliate && isUrl(input.affiliateUrl) ? 5 : 0,
      tip: input.affiliate ? "Add your affiliate signup link" : "An affiliate program helps others recommend you",
    },
    { key: "release", label: "Release date", max: 5, points: input.releaseDate ? 5 : 0, tip: "Add your release date" },
  ];

  const score = checks.reduce((sum, check) => sum + check.points, 0);
  const level =
    score >= 90 ? "Excellent" : score >= 70 ? "Strong" : score >= 40 ? "Good start" : "Needs work";
  // Biggest wins first, so the tips point at what moves the score most.
  const nextSteps = checks
    .filter((check) => check.points < check.max)
    .sort((a, b) => b.max - b.points - (a.max - a.points))
    .slice(0, 4);
  return { score, level, checks, nextSteps };
}

export type ScorableTool = {
  name: string;
  tagline: string;
  websiteUrl: string;
  categoryId: string;
  logoUrl: string | null;
  description: string;
  body: string;
  releaseDate: Date | null;
  pricing: string;
  affiliateProgram: boolean;
  affiliateSignupUrl: string | null;
  _count: { screenshots: number };
} & Record<ScenarioKey, string | null>;

/** The same score for a saved listing, for admin views. */
export function scoreTool(tool: ScorableTool) {
  return scoreListing({
    name: tool.name,
    tagline: tool.tagline,
    websiteUrl: tool.websiteUrl,
    categoryId: tool.categoryId,
    hasLogo: Boolean(tool.logoUrl),
    description: tool.description,
    body: tool.body,
    scenario: Object.fromEntries(SCENARIO_STEPS.map((step) => [step.key, tool[step.key] ?? ""])) as Record<ScenarioKey, string>,
    screenshots: tool._count.screenshots,
    releaseDate: tool.releaseDate ? tool.releaseDate.toISOString() : "",
    pricing: tool.pricing,
    affiliate: tool.affiliateProgram,
    affiliateUrl: tool.affiliateSignupUrl ?? "",
  });
}
