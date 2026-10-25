import type { Pricing } from "@prisma/client";
import { z } from "zod";
import { joinKeywords } from "./keywords";
import { PRICING_VALUES } from "./pricing";
import { slugify } from "./slug";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type Option = { id: string; name: string };

export type AiFillSource = "search" | "third-party" | "description";

export type AiFillResult =
  | {
      status: "ok";
      source: AiFillSource;
      sources: string[];
      fields: {
        name: string;
        slug: string;
        tagline: string;
        description: string;
        body: string;
        websiteUrl: string;
        creatorId: string;
        categoryId: string;
        scenarioUser: string;
        scenarioProblem: string;
        scenarioHow: string;
        scenarioResult: string;
        seoKeywords: string;
      };
      pricing: Pricing | null;
      suggestedCreator: string | null;
      suggestedCategory: string | null;
    }
  | { status: "need_description"; reason: string };

// The model sends null for fields it doesn't know; treat those as empty strings.
const text = z
  .string()
  .nullish()
  .transform((v) => v ?? "");

const draftSchema = z.object({
  found: z.boolean().optional().default(true),
  name: text,
  tagline: text,
  description: text,
  body: text,
  websiteUrl: text,
  creator: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  pricing: z.string().nullish(),
  scenarioUser: text,
  scenarioProblem: text,
  scenarioHow: text,
  scenarioResult: text,
  // Some models answer with an array; accept either.
  seoKeywords: z.union([z.string(), z.array(z.string())]).nullish(),
});

type Draft = z.infer<typeof draftSchema>;

type Input = {
  name: string;
  websiteHint?: string;
  description?: string;
  creators: Option[];
  categories: Option[];
};

export async function aiFillTool(input: Input): Promise<AiFillResult> {
  // 1. LLM with OpenRouter web search
  try {
    const { draft, citations } = await callModel(input, null, true);
    if (draft.found && draft.description && citations.length > 0) {
      return finish(input, draft, "search", citations);
    }
  } catch (err) {
    console.warn("[ai-fill] web search step failed:", err);
  }

  // 2. Third-party sources (Wikipedia, DuckDuckGo, the tool's own site)
  try {
    const { text, sources } = await gatherThirdParty(input.name, input.websiteHint);
    if (text) {
      const { draft } = await callModel(input, text, false);
      if (draft.found && draft.description) {
        return finish(input, draft, "third-party", sources);
      }
    }
  } catch (err) {
    console.warn("[ai-fill] third-party step failed:", err);
  }

  // 3. User-provided summary
  if (!input.description?.trim()) {
    return {
      status: "need_description",
      reason: "Couldn't find this tool online. Add a short summary and the AI will write the rest.",
    };
  }
  const { draft } = await callModel(input, `Admin summary:\n${input.description}`, false, true);
  return finish(input, { ...draft, found: true }, "description", []);
}

async function callModel(input: Input, context: string | null, webSearch: boolean, trusted = false) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  // Kept terse on purpose: every word here is billed on each of up to three calls.
  const system = [
    "Write a software-directory entry. Output only JSON:",
    '{"found":bool,"name":str,"tagline":str,"description":str,"body":str,"websiteUrl":str,"creator":str|null,"category":str|null,"pricing":"FREE"|"FREEMIUM"|"FREE_TRIAL"|"PAID"|"CONTACT"|null,"scenarioUser":str,"scenarioProblem":str,"scenarioHow":str,"scenarioResult":str,"seoKeywords":str}',
    trusted
      ? "The admin summary is the only source and is true; set found=true and write from it."
      : "found=false if the tool can't be verified; never invent facts.",
    "Describe the product itself, not plugins, extensions or integrations for it.",
    "tagline: 4-10 words, no period. description: 1-2 sentences, what+who.",
    "body: 2-3 short plain-text paragraphs (features, use cases, pricing if known).",
    "pricing rules: FREE = everything free, no paid plans. FREEMIUM = a free-forever plan plus paid plans. FREE_TRIAL = paid only, with a time-limited trial. PAID = paid only, no free plan or trial. CONTACT = no public prices, sales/quote only. null only if truly unknown.",
    "scenario*: one illustrative customer story (an invented persona is fine) that only uses the tool's real features. scenarioUser: a named person + role, e.g. 'Sara runs operations for a 15-person online store'. scenarioProblem: their pain, one sentence. scenarioHow: how they use this tool, one or two sentences. scenarioResult: the outcome, with a plausible number.",
    "seoKeywords: 6-10 comma-separated search phrases people would type to find this tool (category terms, use cases, 'X alternative'), lowercase.",
    "websiteUrl: official https homepage. creator: maker. creator/category: reuse a listed name if it fits.",
    // Lists live here, not in the user message: the web plugin builds its search query from the user turn.
    `Creators: ${input.creators.map((c) => c.name).join(", ") || "-"}`,
    `Categories: ${input.categories.map((c) => c.name).join(", ") || "-"}`,
  ].join("\n");

  const user = [
    // The web plugin searches with this message, so name the pricing page explicitly to get plan details.
    `Tool: ${input.name} (product overview, pricing plans, free plan or free trial)`,
    input.websiteHint ? `Site: ${input.websiteHint}` : "",
    input.description && context === null ? `Notes: ${input.description}` : "",
    context ? `Sources:\n${context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "x-title": "ToolsMade Admin",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
      // A full entry is ~350 tokens; also stops OpenRouter reserving the whole context window (402 on low balance).
      max_tokens: 1000,
      temperature: 0.3,
      reasoning: { enabled: false },
      response_format: { type: "json_object" },
      ...(webSearch ? { plugins: [{ id: "web", max_results: 3, search_prompt: "Web results:" }] } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = await res.json();
  const u = json.usage;
  console.info(`[ai-fill] ${webSearch ? "search" : "context"}: in ${u?.prompt_tokens} / out ${u?.completion_tokens} tokens, $${u?.cost}`);
  const message = json.choices?.[0]?.message;
  const citations: string[] = (message?.annotations ?? [])
    .filter((a: { type: string }) => a.type === "url_citation")
    .map((a: { url_citation: { url: string } }) => a.url_citation.url);

  return { draft: parseDraft(String(message?.content ?? "")), citations: [...new Set(citations)] };
}

function parseDraft(content: string): Draft {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  return draftSchema.parse(JSON.parse(content.slice(start, end + 1)));
}

async function gatherThirdParty(name: string, websiteHint?: string) {
  const parts: string[] = [];
  const sources: string[] = [];

  const [ddg, wiki] = await Promise.allSettled([
    getJson(`https://api.duckduckgo.com/?q=${encodeURIComponent(name)}&format=json&no_html=1&skip_disambig=1`),
    getJson(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=${encodeURIComponent(`${name} software`)}`,
    ),
  ]);

  let site = websiteHint;
  if (ddg.status === "fulfilled" && ddg.value?.AbstractText) {
    parts.push(`DuckDuckGo: ${ddg.value.AbstractText}`);
    if (ddg.value.AbstractURL) sources.push(ddg.value.AbstractURL);
    const official = ddg.value.Results?.[0]?.FirstURL;
    if (!site && official) site = official;
  }

  const title = wiki.status === "fulfilled" ? wiki.value?.query?.search?.[0]?.title : null;
  if (title && title.toLowerCase().includes(name.toLowerCase().split(" ")[0])) {
    const summary = await getJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    ).catch(() => null);
    if (summary?.extract) {
      parts.push(`Wikipedia (${title}): ${summary.extract}`);
      sources.push(summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${title}`);
    }
  }

  if (site) {
    const pageText = await fetchSiteText(site).catch(() => null);
    if (pageText) {
      parts.push(`Official site ${site}:\n${pageText}`);
      sources.push(site);
    }
  }

  return { text: parts.join("\n\n").slice(0, 3000), sources };
}

async function getJson(url: string) {
  const res = await fetch(url, {
    headers: { "user-agent": "ToolsMadeAdmin/1.0" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function fetchSiteText(url: string) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 ToolsMadeAdmin/1.0" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const html = (await res.text()).slice(0, 300_000);
  const meta = (key: string) =>
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)`, "i"))?.[1];
  const title = html.match(/<title[^>]*>([^<]+)/i)?.[1];
  const text = html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1500);
  return [title && `Title: ${title}`, meta("description") && `Meta: ${meta("description")}`, meta("og:description") && `OG: ${meta("og:description")}`, text]
    .filter(Boolean)
    .join("\n");
}

function finish(input: Input, draft: Draft, source: AiFillSource, sources: string[]): AiFillResult {
  const creator = matchOption(input.creators, draft.creator);
  const category = matchOption(input.categories, draft.category);
  const name = draft.name || input.name;
  let websiteUrl = draft.websiteUrl || input.websiteHint || "";
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) websiteUrl = `https://${websiteUrl}`;

  return {
    status: "ok",
    source,
    sources,
    fields: {
      name,
      slug: slugify(name),
      tagline: draft.tagline.replace(/\.$/, ""),
      description: draft.description,
      body: draft.body,
      websiteUrl,
      creatorId: creator?.id ?? "",
      categoryId: category?.id ?? "",
      scenarioUser: draft.scenarioUser,
      scenarioProblem: draft.scenarioProblem,
      scenarioHow: draft.scenarioHow,
      scenarioResult: draft.scenarioResult,
      seoKeywords: joinKeywords(draft.seoKeywords) ?? "",
    },
    pricing: normalizePricing(draft.pricing),
    suggestedCreator: creator ? null : draft.creator || null,
    suggestedCategory: category ? null : draft.category || null,
  };
}

function matchOption(options: Option[], value?: string | null) {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  return (
    options.find((o) => o.name.toLowerCase() === v) ??
    options.find((o) => o.name.toLowerCase().includes(v) || v.includes(o.name.toLowerCase()))
  );
}

/** Accepts the enum ("FREE_TRIAL") or loose variants the model sometimes returns ("Free trial", "free-trial", "freemium"). */
function normalizePricing(value: string | null | undefined): Pricing | null {
  if (!value) return null;
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if ((PRICING_VALUES as string[]).includes(key)) return key as Pricing;
  if (/^TRIAL|FREE_?TRIAL/.test(key)) return "FREE_TRIAL";
  if (/CONTACT|QUOTE|SALES|ENTERPRISE/.test(key)) return "CONTACT";
  return null;
}
