import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { toolPayload } from "./admin-schema";
import { CsvError, parseCsv, toCsv, unguard } from "./csv";
import { prisma } from "./prisma";
import { withScenario } from "./scenario";
import { slugify } from "./slug";

// Admin CSV export/import of every tool. The export is exactly the import format, so the round trip
// is: export, edit in a spreadsheet, import. Rows are matched to tools by slug.

export const TOOL_CSV_COLUMNS = [
  "slug",
  "name",
  "status",
  "featured",
  "pricing",
  "category",
  "creator",
  "tagline",
  "description",
  "body",
  "websiteUrl",
  "logoUrl",
  "screenshots",
  "releaseDate",
  "seoKeywords",
  "scenarioUser",
  "scenarioProblem",
  "scenarioHow",
  "scenarioResult",
  "exampleScenario",
  "affiliateProgram",
  "affiliateSignupUrl",
  "affiliateLink",
] as const;

type Column = (typeof TOOL_CSV_COLUMNS)[number];
type ToolRow = Record<Column, string>;

// Screenshot image URLs share one cell, one per line, in display order.
const SCREENSHOT_SEPARATOR = "\n";
const TRUE_VALUES = ["true", "yes", "1"];
const FALSE_VALUES = ["false", "no", "0", ""];
// Imports run in one transaction; this leaves room for a few hundred rows on a slow database link.
const IMPORT_TIMEOUT_MS = 120_000;
const MAX_ERRORS_SHOWN = 20;
// Fields the row sets through slugs or yes/no words, checked before zod with friendlier messages.
const REFERENCE_FIELDS = ["categoryId", "creatorId", "featured", "affiliateProgram"];

const CSV_TOOL_INCLUDE = {
  category: { select: { slug: true } },
  creator: { select: { slug: true } },
  screenshots: { orderBy: { sortOrder: "asc" }, select: { imageUrl: true, alt: true } },
} satisfies Prisma.ToolInclude;

type CsvTool = Prisma.ToolGetPayload<{ include: typeof CSV_TOOL_INCLUDE }>;
// A validated row, ready to write.
type ToolData = z.output<typeof toolPayload> & { exampleScenario?: string | null };

function toolToRow(tool: CsvTool): ToolRow {
  return {
    slug: tool.slug,
    name: tool.name,
    status: tool.status,
    featured: String(tool.featured),
    pricing: tool.pricing,
    category: tool.category.slug,
    creator: tool.creator.slug,
    tagline: tool.tagline,
    description: tool.description,
    body: tool.body,
    websiteUrl: tool.websiteUrl,
    logoUrl: tool.logoUrl ?? "",
    screenshots: tool.screenshots.map((shot) => shot.imageUrl).join(SCREENSHOT_SEPARATOR),
    releaseDate: tool.releaseDate?.toISOString().slice(0, 10) ?? "",
    seoKeywords: tool.seoKeywords ?? "",
    scenarioUser: tool.scenarioUser ?? "",
    scenarioProblem: tool.scenarioProblem ?? "",
    scenarioHow: tool.scenarioHow ?? "",
    scenarioResult: tool.scenarioResult ?? "",
    exampleScenario: tool.exampleScenario ?? "",
    affiliateProgram: String(tool.affiliateProgram),
    affiliateSignupUrl: tool.affiliateSignupUrl ?? "",
    affiliateLink: tool.affiliateLink ?? "",
  };
}

export async function exportToolsCsv() {
  const tools = await prisma.tool.findMany({ include: CSV_TOOL_INCLUDE, orderBy: { name: "asc" } });
  const rows = tools.map((tool) => {
    const row = toolToRow(tool);
    return TOOL_CSV_COLUMNS.map((column) => row[column]);
  });
  return toCsv([[...TOOL_CSV_COLUMNS], ...rows]);
}

export type ToolImportResult = { ok: true; created: number; updated: number; unchanged: number } | { ok: false; errors: string[] };

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.includes(normalized)) return true;
  if (FALSE_VALUES.includes(normalized)) return false;
  return null;
}

function splitScreenshots(value: string) {
  return value
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);
}

/**
 * Creates tools whose slug is new and updates the rest. All or nothing: if any row is invalid, nothing
 * is written and every problem is reported. Columns left out of the file keep their current values
 * (so a file with just `slug,featured` only changes `featured`); a blank cell clears an optional field.
 */
export async function importToolsCsv(text: string): Promise<ToolImportResult> {
  let table: string[][];
  try {
    table = parseCsv(text);
  } catch (err) {
    if (err instanceof CsvError) return { ok: false, errors: [err.message] };
    throw err;
  }
  const [header, ...records] = table;
  if (!header || !records.length) return { ok: false, errors: ["The file has no tool rows."] };

  const columns = header.map((name) => name.trim());
  const unknown = columns.filter((name) => !TOOL_CSV_COLUMNS.includes(name as Column));
  if (unknown.length) {
    return { ok: false, errors: [`Unknown column${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. Use the columns from an export.`] };
  }
  if (!columns.includes("slug") && !columns.includes("name")) {
    return { ok: false, errors: ["Add a slug column (or a name column for brand-new tools)."] };
  }

  const [existing, categories, creators] = await Promise.all([
    prisma.tool.findMany({ include: CSV_TOOL_INCLUDE }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.creator.findMany({ select: { id: true, slug: true } }),
  ]);
  const bySlug = new Map(existing.map((tool) => [tool.slug, tool]));
  const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));
  const creatorIds = new Map(creators.map((creator) => [creator.slug, creator.id]));

  const errors: string[] = [];
  const seen = new Set<string>();
  const writes: { current: CsvTool | undefined; data: ToolData; screenshots: string[] | null }[] = [];

  for (const [index, record] of records.entries()) {
    // Header is line 1 of the spreadsheet.
    const line = `Row ${index + 2}`;
    const cells = Object.fromEntries(columns.map((column, i) => [column, unguard(record[i] ?? "").trim()])) as Partial<ToolRow>;
    const slug = slugify(cells.slug || cells.name || "");
    if (!slug) {
      errors.push(`${line}: add a slug or a name.`);
      continue;
    }
    if (seen.has(slug)) {
      errors.push(`${line}: slug "${slug}" appears more than once in the file.`);
      continue;
    }
    seen.add(slug);

    const current = bySlug.get(slug);
    // Start from the tool as it is (or blanks for a new one) and apply the file's columns on top.
    const row: ToolRow = { ...(current ? toolToRow(current) : blankRow()), ...cells, slug };
    const label = `${line} (${slug})`;

    const featured = parseBoolean(row.featured);
    const affiliateProgram = parseBoolean(row.affiliateProgram);
    const categoryId = categoryIds.get(row.category);
    const creatorId = creatorIds.get(row.creator);
    const problems = [
      featured === null ? `featured must be true or false` : null,
      affiliateProgram === null ? `affiliateProgram must be true or false` : null,
      categoryId ? null : row.category ? `no category with slug "${row.category}"` : "category is required (a category slug)",
      creatorId ? null : row.creator ? `no creator with slug "${row.creator}"` : "creator is required (a creator slug)",
    ].filter(Boolean);

    const parsed = toolPayload.safeParse({
      ...row,
      status: row.status.toUpperCase(),
      pricing: row.pricing ? row.pricing.toUpperCase() : undefined,
      logoUrl: row.logoUrl || null,
      featured,
      affiliateProgram,
      categoryId,
      creatorId,
    });
    if (!parsed.success || problems.length) {
      // Missing/unknown references are already explained above, so skip zod's take on the same fields.
      const issues = (parsed.error?.issues ?? [])
        .filter((issue) => !REFERENCE_FIELDS.includes(String(issue.path[0])))
        .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`);
      errors.push(`${label}: ${[...problems, ...issues].join("; ")}.`);
      continue;
    }

    writes.push({
      current,
      data: { ...parsed.data, slug, ...withScenario(parsed.data) },
      // Only touch screenshots when the file has that column.
      screenshots: columns.includes("screenshots") ? splitScreenshots(row.screenshots) : null,
    });
  }

  if (errors.length) {
    const extra = errors.length - MAX_ERRORS_SHOWN;
    return { ok: false, errors: extra > 0 ? [...errors.slice(0, MAX_ERRORS_SHOWN), `…and ${extra} more.`] : errors };
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  await prisma.$transaction(
    async (tx) => {
      for (const { current, data, screenshots } of writes) {
        if (!current) {
          const tool = await tx.tool.create({ data });
          if (screenshots?.length) await tx.screenshot.createMany({ data: screenshotRows(tool.id, data.name, screenshots, []) });
          created++;
          continue;
        }

        const dataChanged = rowChanged(current, data);
        const shotsChanged = screenshots !== null && screenshots.join("\n") !== current.screenshots.map((shot) => shot.imageUrl).join("\n");
        if (!dataChanged && !shotsChanged) {
          unchanged++;
          continue;
        }
        if (dataChanged) await tx.tool.update({ where: { id: current.id }, data });
        if (shotsChanged && screenshots) {
          // Replace the list, keeping the alt text of images that stay. Image files are left in storage.
          await tx.screenshot.deleteMany({ where: { toolId: current.id } });
          if (screenshots.length) await tx.screenshot.createMany({ data: screenshotRows(current.id, data.name, screenshots, current.screenshots) });
        }
        updated++;
      }
    },
    { timeout: IMPORT_TIMEOUT_MS, maxWait: IMPORT_TIMEOUT_MS },
  );
  return { ok: true, created, updated, unchanged };
}

function blankRow(): ToolRow {
  return { ...(Object.fromEntries(TOOL_CSV_COLUMNS.map((column) => [column, ""])) as ToolRow), status: "DRAFT", featured: "false", affiliateProgram: "false" };
}

function screenshotRows(toolId: string, name: string, urls: string[], previous: { imageUrl: string; alt: string }[]) {
  return urls.map((imageUrl, sortOrder) => ({
    toolId,
    imageUrl,
    alt: previous.find((shot) => shot.imageUrl === imageUrl)?.alt ?? `${name} screenshot ${sortOrder + 1}`,
    sortOrder,
  }));
}

// Compared through their ids instead, since the row holds slugs looked up from the relations.
const RELATION_COLUMNS: Column[] = ["category", "creator", "screenshots"];

/** Compares as CSV text, so "changed" agrees with what the admin sees in the file. */
function rowChanged(current: CsvTool, data: ToolData) {
  const before = toolToRow(current);
  const after = toolToRow({ ...current, ...data });
  const fieldChanged = TOOL_CSV_COLUMNS.some((column) => !RELATION_COLUMNS.includes(column) && before[column] !== after[column]);
  return fieldChanged || data.categoryId !== current.categoryId || data.creatorId !== current.creatorId;
}
