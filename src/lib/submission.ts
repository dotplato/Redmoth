import { NextResponse } from "next/server";
import { fieldErrors, submissionPayload } from "./admin-schema";
import { uniqueSlug } from "./slug";
import { prisma } from "./prisma";
import { joinScenario } from "./scenario";
import { MAX_SCREENSHOTS } from "./upload-limits";
import { UploadError, uploadedImages } from "./uploads";

type Parsed = Extract<ReturnType<typeof submissionPayload.safeParse>, { success: true }>["data"];

/**
 * Validates a submit-form post and its already-uploaded images. Shared by new submissions and resubmissions.
 * `existingLogo`/`keptScreenshots` let an edit keep files it already has instead of re-uploading them.
 */
export async function readSubmission(
  form: FormData,
  { existingLogo = false, keptScreenshots = 0 }: { existingLogo?: boolean; keptScreenshots?: number } = {},
): Promise<{ ok: false; response: NextResponse } | { ok: true; data: Parsed; logoUrl: string | null; screenshotUrls: string[]; categoryId: string }> {
  const fail = (errors: Record<string, string>) => ({ ok: false as const, response: NextResponse.json({ errors }, { status: 400 }) });

  const raw = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string")) as Record<string, string>;
  const parsed = submissionPayload.safeParse(raw);
  // The browser uploads files to R2 first and posts their URLs under the same field names.
  const logo = form.getAll("logo").find((value) => typeof value === "string" && value);
  const shots = form.getAll("screenshots").filter((value) => typeof value === "string" && value);
  const totalShots = keptScreenshots + shots.length;

  // Collect every problem in one pass so the form can show them all at once.
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);
  if (!logo && !raw.logoUrl && !existingLogo) errors.logo ??= "Upload a logo or paste a logo URL";
  if (totalShots === 0) errors.screenshots = "Add at least one in-app screenshot";
  else if (totalShots > MAX_SCREENSHOTS) errors.screenshots = `Add up to ${MAX_SCREENSHOTS} screenshots`;
  if (!parsed.success || Object.keys(errors).length) return fail(errors);
  const data = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return fail({ categoryId: "Pick a category" });

  let logoUrl = data.logoUrl;
  let screenshotUrls: string[];
  try {
    if (logo) [logoUrl] = await uploadedImages(form, "logo", "logos");
  } catch (err) {
    if (err instanceof UploadError) return fail({ logo: err.message });
    throw err;
  }
  try {
    screenshotUrls = await uploadedImages(form, "screenshots", "screenshots");
  } catch (err) {
    if (err instanceof UploadError) return fail({ screenshots: err.message });
    throw err;
  }

  return { ok: true, data, logoUrl, screenshotUrls, categoryId: category.id };
}

/** Listing fields written from a validated submission (same for create and resubmit). */
export function submissionFields(data: Parsed) {
  return {
    name: data.name,
    tagline: data.tagline,
    description: data.description,
    body: data.body,
    websiteUrl: data.websiteUrl,
    pricing: data.pricing,
    exampleScenario: joinScenario(data),
    scenarioUser: data.scenarioUser,
    scenarioProblem: data.scenarioProblem,
    scenarioHow: data.scenarioHow,
    scenarioResult: data.scenarioResult,
    releaseDate: data.releaseDate,
    seoKeywords: data.seoKeywords,
    affiliateProgram: data.affiliateProgram === "yes",
    affiliateSignupUrl: data.affiliateProgram === "yes" ? data.affiliateSignupUrl : null,
  };
}

/**
 * Which maker profile the app is listed under. The submitter's own profile when the name matches;
 * otherwise an existing login-less maker with that name, or a new one. Never another account's profile.
 */
export async function resolveMaker(account: { id: string; name: string }, makerName: string, appName: string) {
  if (makerName.toLowerCase() === account.name.toLowerCase()) return account.id;
  const existing = await prisma.creator.findFirst({ where: { name: makerName, userId: null } });
  if (existing) return existing.id;
  const slug = await uniqueSlug(makerName, async (s) => Boolean(await prisma.creator.findUnique({ where: { slug: s } })));
  const made = await prisma.creator.create({ data: { name: makerName, slug, bio: `Maker of ${appName}.` } });
  return made.id;
}
