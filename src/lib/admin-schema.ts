import { z } from "zod";
import { joinKeywords } from "./keywords";
import { PRICING_VALUES } from "./pricing";

// Empty form inputs arrive as "" — store those as null.
const optionalUrl = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);

// <input type="date"> sends "YYYY-MM-DD" (or "" when left blank); stored as UTC midnight.
const optionalDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? new Date(`${value}T00:00:00Z`) : null));

const scenarioPart = (missing: string) =>
  z.string({ message: missing }).trim().min(8, missing).max(300, "Keep each step under 300 characters");

const optionalText = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null);

// Comma-separated keywords, normalised (trimmed, de-duplicated, capped); "" becomes null.
const seoKeywords = z
  .string()
  .max(2000)
  .nullish()
  .transform((value) => joinKeywords(value));

export const toolPayload = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  tagline: z.string().min(4),
  description: z.string().min(8),
  body: z.string().min(8),
  websiteUrl: z.string().url(),
  logoUrl: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "REJECTED"]),
  featured: z.boolean().optional().default(false),
  pricing: z.enum(PRICING_VALUES).optional().default("PAID"),
  exampleScenario: optionalText,
  scenarioUser: optionalText,
  scenarioProblem: optionalText,
  scenarioHow: optionalText,
  scenarioResult: optionalText,
  releaseDate: optionalDate,
  seoKeywords,
  affiliateProgram: z.boolean().optional().default(false),
  affiliateSignupUrl: optionalUrl,
  affiliateLink: optionalUrl,
  creatorId: z.string().min(1),
  categoryId: z.string().min(1),
});

/** Public "submit a tool" form. No slug, status or featured: the platform decides those. */
export const submissionPayload = z
  .object({
    name: z.string().trim().min(2, "Add the app name"),
    tagline: z.string().trim().min(4, "Add a short tagline").max(90, "Keep the tagline under 90 characters"),
    description: z.string().trim().min(20, "Describe the app in a sentence or two").max(400),
    body: z.string().trim().min(40, "Add a few more details (features, use cases, pricing)"),
    websiteUrl: z.string().trim().url("Enter a full website URL, including https://"),
    logoUrl: optionalUrl,
    // A disabled placeholder option isn't submitted, so a missing value arrives as undefined.
    categoryId: z.string({ message: "Pick a category" }).min(1, "Pick a category"),
    releaseDate: optionalDate,
    seoKeywords,
    pricing: z.enum(PRICING_VALUES, { message: "Choose a pricing model" }),
    scenarioUser: scenarioPart("Who is the real user?"),
    scenarioProblem: scenarioPart("What problem did they have?"),
    scenarioHow: scenarioPart("How does your app help them?"),
    scenarioResult: scenarioPart("What was the result?"),
    affiliateProgram: z.enum(["yes", "no"], { message: "Tell us if you have an affiliate program" }),
    affiliateSignupUrl: optionalUrl,
    makerName: z.string({ message: "Who makes this app?" }).trim().min(2, "Who makes this app?").max(80),
  })
  .refine((data) => data.affiliateProgram === "no" || data.affiliateSignupUrl, {
    path: ["affiliateSignupUrl"],
    message: "Add your affiliate program signup link",
  });

export const creatorPayload = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  bio: z.string().min(8),
  website: z.string().url().optional().nullable().or(z.literal("")),
  avatarUrl: z.string().optional().nullable(),
});

export const creatorSignupPayload = z.object({
  name: z.string().trim().min(2, "Add your name or studio name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export const creatorProfilePayload = z.object({
  name: z.string().trim().min(2, "Add your name"),
  bio: z.string().trim().min(8, "Write a short bio (8+ characters)").max(600),
  website: optionalUrl,
});

export const categoryPayload = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

/** Flattens a zod error into { field: firstMessage } for inline form errors. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
