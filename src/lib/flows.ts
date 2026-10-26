import { NextResponse } from "next/server";
import { cache } from "react";
import { FLOW_LIMITS, type FlowStepInput } from "./flow-limits";
import { prisma } from "./prisma";
import { UploadError, uploadedImages } from "./uploads";

/** What a flow card needs: stack logos in order, step count, labels. */
export const FLOW_CARD = {
  category: true,
  author: { select: { name: true, slug: true } },
  stack: {
    orderBy: { position: "asc" as const },
    where: { tool: { status: "PUBLISHED" as const } },
    include: { tool: { select: { id: true, name: true, slug: true, logoUrl: true } } },
  },
  _count: { select: { steps: true } },
};

export type FlowSort = "featured" | "newest" | "popular";

const ORDER = {
  featured: [{ featured: "desc" as const }, { visits: "desc" as const }, { createdAt: "desc" as const }],
  newest: [{ createdAt: "desc" as const }],
  popular: [{ visits: "desc" as const }, { createdAt: "desc" as const }],
};

export async function listFlows(filters?: { q?: string; category?: string; sort?: FlowSort }) {
  return prisma.flow.findMany({
    where: {
      ...(filters?.category ? { category: { slug: filters.category } } : {}),
      ...(filters?.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { summary: { contains: filters.q, mode: "insensitive" } },
              // Finding flows by an app in them ("notion") is the most common search.
              { stack: { some: { tool: { name: { contains: filters.q, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    },
    include: FLOW_CARD,
    orderBy: ORDER[filters?.sort ?? "featured"],
  });
}

export async function flowCategoriesWithCounts() {
  return prisma.category.findMany({ include: { _count: { select: { flows: true } } }, orderBy: { name: "asc" } });
}

/** Cached per request: the page and its generateMetadata share one query. */
export const getFlowBySlug = cache(async (slug: string) => {
  return prisma.flow.findUnique({
    where: { slug },
    include: {
      category: true,
      author: true,
      stack: { orderBy: { position: "asc" }, include: { tool: { include: { category: true } } } },
      steps: { orderBy: { position: "asc" }, include: { tool: { select: { id: true, name: true, slug: true, logoUrl: true, status: true } } } },
    },
  });
});

type Parsed = {
  title: string;
  summary: string;
  categoryId: string;
  stack: string[];
  steps: FlowStepInput[];
  logoUrl: string | null | undefined; // undefined = keep the current logo
};

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

function json<T>(value: FormDataEntryValue | null, fallback: T): T {
  try {
    return typeof value === "string" ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function length(errors: Record<string, string>, key: string, value: string, [min, max]: readonly [number, number], what: string) {
  if (value.length < min) errors[key] = value ? `${what} needs at least ${min} characters` : `Add ${what.toLowerCase()}`;
  else if (value.length > max) errors[key] = `${what} can be at most ${max} characters`;
}

/**
 * Validates a Create/Edit Flow post: details, a stack of published apps, and steps that each use an
 * app from the stack. Error keys match the form's field ids (`step-2-title` etc.) so they show in place.
 */
export async function readFlow(form: FormData, { hasLogo = false } = {}): Promise<{ ok: false; response: NextResponse } | { ok: true; data: Parsed }> {
  const errors: Record<string, string> = {};
  const fail = () => ({ ok: false as const, response: NextResponse.json({ errors }, { status: 400 }) });

  const title = text(form, "title");
  const summary = text(form, "summary");
  const categoryId = text(form, "categoryId");
  const rawStack = json<unknown>(form.get("stack"), []);
  const rawSteps = json<unknown>(form.get("steps"), []);
  const stack = Array.isArray(rawStack) ? [...new Set(rawStack.filter((id): id is string => typeof id === "string"))] : [];
  const steps: FlowStepInput[] = Array.isArray(rawSteps)
    ? rawSteps.map((step) => ({
        toolId: typeof step?.toolId === "string" ? step.toolId : "",
        title: typeof step?.title === "string" ? step.title.trim() : "",
        description: typeof step?.description === "string" ? step.description.trim() : "",
      }))
    : [];

  length(errors, "title", title, FLOW_LIMITS.title, "Title");
  length(errors, "summary", summary, FLOW_LIMITS.summary, "Description");
  if (!categoryId) errors.categoryId = "Pick a category";

  if (stack.length < FLOW_LIMITS.minStack) errors.stack = `Add at least ${FLOW_LIMITS.minStack} apps to your stack`;
  else if (stack.length > FLOW_LIMITS.maxStack) errors.stack = `A stack can have up to ${FLOW_LIMITS.maxStack} apps`;
  const live = await prisma.tool.findMany({ where: { id: { in: stack }, status: "PUBLISHED" }, select: { id: true } });
  if (live.length !== stack.length) errors.stack ??= "One of these apps is no longer listed. Remove it and try again.";

  if (steps.length < FLOW_LIMITS.minSteps) errors.steps = `Add at least ${FLOW_LIMITS.minSteps} steps`;
  else if (steps.length > FLOW_LIMITS.maxSteps) errors.steps = `A flow can have up to ${FLOW_LIMITS.maxSteps} steps`;
  steps.forEach((step, i) => {
    if (!step.toolId || !stack.includes(step.toolId)) errors[`step-${i}-toolId`] = "Choose an app from your stack";
    length(errors, `step-${i}-title`, step.title, FLOW_LIMITS.stepTitle, "Step title");
    length(errors, `step-${i}-description`, step.description, FLOW_LIMITS.stepDescription, "Step description");
  });

  if (categoryId && !(await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }))) {
    errors.categoryId = "Pick a category";
  }
  if (Object.keys(errors).length) return fail();

  // Logo is optional: without one, the flow shows its stack's logos instead.
  let logoUrl: string | null | undefined = hasLogo ? undefined : null;
  if (text(form, "removeLogo") === "yes") logoUrl = null;
  try {
    const [uploaded] = await uploadedImages(form, "logo", "logos");
    if (uploaded) logoUrl = uploaded;
  } catch (err) {
    if (err instanceof UploadError) {
      errors.logo = err.message;
      return fail();
    }
    throw err;
  }

  return { ok: true, data: { title, summary, categoryId, stack, steps, logoUrl } };
}

/** Nested writes for the stack and steps (create and edit replace them wholesale). */
export function flowChildren(data: Parsed) {
  return {
    stack: { create: data.stack.map((toolId, position) => ({ toolId, position })) },
    steps: { create: data.steps.map((step, position) => ({ ...step, position })) },
  };
}
