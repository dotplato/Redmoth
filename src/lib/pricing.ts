import type { Pricing } from "@prisma/client";

/** Pricing models: label, catalog filter slug, and tag colours (text/border + soft fill). */
export const PRICING_OPTIONS: { value: Pricing; label: string; slug: string; color: string; soft: string }[] = [
  { value: "FREE", label: "Free", slug: "free", color: "#1d7a49", soft: "#e2f3e9" },
  { value: "FREEMIUM", label: "Freemium", slug: "freemium", color: "#1f5fbf", soft: "#e4edfb" },
  { value: "FREE_TRIAL", label: "Free trial", slug: "free-trial", color: "#b45309", soft: "#fdf0dc" },
  { value: "PAID", label: "Paid", slug: "paid", color: "#4a4a45", soft: "#eeeee9" },
  { value: "CONTACT", label: "Contact", slug: "contact", color: "#7a3fc4", soft: "#f1e8fb" },
];

export const PRICING_VALUES = PRICING_OPTIONS.map((option) => option.value) as [Pricing, ...Pricing[]];

/** Models where someone can start without paying (used for "free" intents and the home stat). */
export const NO_COST_TO_START: Pricing[] = ["FREE", "FREEMIUM", "FREE_TRIAL"];

export function pricingOption(value: Pricing | string | null | undefined) {
  return PRICING_OPTIONS.find((option) => option.value === value) ?? null;
}

export function pricingFromSlug(slug: string | undefined) {
  return PRICING_OPTIONS.find((option) => option.slug === slug)?.value;
}
