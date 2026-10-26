import { FLOW_CARD } from "./flows";
import { NO_COST_TO_START, pricingOption } from "./pricing";
import { prisma } from "./prisma";
import { VISITS } from "./queries";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_RESULTS = 6;
const MAX_FLOW_RESULTS = 4;
// The whole catalog goes into one prompt; beyond this many apps (or flows), keyword-prefilter first.
const MAX_CANDIDATES = 80;
const MAX_FLOW_CANDIDATES = 40;
const CACHE_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT = { windowMs: 60 * 1000, max: 8 };

export type SearchMode = "ai" | "keyword";

async function loadCatalog() {
  return prisma.tool.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true, creator: true, ...VISITS },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });
}

async function loadFlows() {
  return prisma.flow.findMany({
    include: { ...FLOW_CARD, steps: { orderBy: { position: "asc" }, select: { title: true } } },
    orderBy: [{ featured: "desc" }, { visits: "desc" }],
  });
}

type CatalogTool = Awaited<ReturnType<typeof loadCatalog>>[number];
type CatalogFlow = Awaited<ReturnType<typeof loadFlows>>[number];
export type SearchResult = { tool: CatalogTool; why: string | null };
export type FlowResult = { flow: CatalogFlow; why: string | null };
type Picked = { id: string; why: string | null };
type Ranked = { tools: Picked[]; flows: Picked[] };

// In-memory state: fine for a single dev/server process; swap for Redis if this runs on several instances.
const cache = new Map<string, { at: number; ids: Ranked; mode: SearchMode }>();
const hits = new Map<string, number[]>();

function allow(clientKey: string) {
  const now = Date.now();
  const recent = (hits.get(clientKey) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(clientKey, recent);
  return recent.length <= RATE_LIMIT.max;
}

/** Matches a plain-language need to listed apps and community flows, in one model call. */
export async function aiSearch(
  rawQuery: string,
  clientKey: string,
): Promise<{ mode: SearchMode; results: SearchResult[]; flows: FlowResult[] }> {
  const query = rawQuery.trim().slice(0, 300);
  const [catalog, flows] = await Promise.all([loadCatalog(), loadFlows()]);
  if (!query || catalog.length + flows.length === 0) return { mode: "keyword", results: [], flows: [] };

  const toolsById = new Map(catalog.map((tool) => [tool.id, tool]));
  const flowsById = new Map(flows.map((flow) => [flow.id, flow]));
  const hydrate = (ids: Ranked) => ({
    results: ids.tools.flatMap(({ id, why }) => (toolsById.has(id) ? [{ tool: toolsById.get(id)!, why }] : [])),
    flows: ids.flows.flatMap(({ id, why }) => (flowsById.has(id) ? [{ flow: flowsById.get(id)!, why }] : [])),
  });

  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return { mode: cached.mode, ...hydrate(cached.ids) };

  let mode: SearchMode = "keyword";
  let ids: Ranked;
  try {
    if (!allow(clientKey)) throw new Error("rate limited");
    const tools = catalog.length > MAX_CANDIDATES ? rank(query, catalog, keywordScore).slice(0, MAX_CANDIDATES) : catalog;
    const flowCandidates = flows.length > MAX_FLOW_CANDIDATES ? rank(query, flows, flowScore).slice(0, MAX_FLOW_CANDIDATES) : flows;
    ids = await ensureApps(query, await rankWithModel(query, tools, flowCandidates), tools, flowCandidates);
    mode = "ai";
  } catch (err) {
    console.warn("[ai-search] falling back to keyword search:", err instanceof Error ? err.message : err);
    ids = {
      tools: rank(query, catalog, keywordScore)
        .filter((tool) => keywordScore(query, tool) > 0)
        .slice(0, MAX_RESULTS)
        .map((tool) => ({ id: tool.id, why: null })),
      flows: rank(query, flows, flowScore)
        .filter((flow) => flowScore(query, flow) > 0)
        .slice(0, MAX_FLOW_RESULTS)
        .map((flow) => ({ id: flow.id, why: null })),
    };
    if (!ids.tools.length) ids.tools = appsFromFlows(ids, catalog, flows);
  }

  // Only cache AI answers; a fallback should get a fresh AI attempt next time.
  if (mode === "ai") {
    cache.set(key, { at: Date.now(), ids, mode });
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
  }
  return { mode, ...hydrate(ids) };
}

async function rankWithModel(query: string, tools: CatalogTool[], flows: CatalogFlow[]): Promise<Ranked> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  // Short ids (A1…, F1…), one line each: keeps the prompt small and stops the model inventing listings.
  const appLines = tools.map((tool, index) =>
    [
      `A${index + 1}. ${tool.name} — ${tool.tagline}`,
      tool.category.name,
      pricingOption(tool.pricing)?.label ?? "Paid",
      clip(tool.description, 140),
      tool.seoKeywords ? `keywords: ${clip(tool.seoKeywords, 120)}` : "",
      tool.exampleScenario ? `e.g. ${clip(tool.exampleScenario, 160)}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
  );
  const flowLines = flows.map((flow, index) =>
    [
      `F${index + 1}. ${flow.title} — ${clip(flow.summary, 140)}`,
      flow.category.name,
      `uses ${flow.stack.map((item) => item.tool.name).join(", ")}`,
      `steps: ${clip(flow.steps.map((step) => step.title).join("; "), 160)}`,
    ].join(" | "),
  );

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "x-title": "redmoth Search" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
      max_tokens: 600,
      temperature: 0.2,
      reasoning: { enabled: false },
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You match a person's need to apps and to workflows (flows: a stack of apps used step by step) from a catalog. Output only JSON:",
            '{"apps":[{"id":"A3","why":string}],"flows":[{"id":"F1","why":string}]}',
            "The need may be in any language or mixed/romanized (e.g. Roman Urdu, Hindi). Understand it, but write every why in English.",
            `Judge apps and flows separately — finding a matching flow never replaces matching apps. apps: up to ${MAX_RESULTS} (ids A…), flows: up to ${MAX_FLOW_RESULTS} (ids F…), best match first.`,
            "Include an app when it handles a real part of the task (e.g. for cold emailing: writing, personalising, sending or tracking emails, finding leads). Leave out apps with no clear link to the need.",
            "Return an empty list only when nothing in that list helps.",
            "why: max 18 words, speak to the user, name the specific way it fits their need. Refer to items by name, never by id.",
            "Pricing is one of Free, Freemium, Free trial, Paid, Contact. If the user asks for free or no-cost tools, only include Free, Freemium or Free trial apps.",
          ].join("\n"),
        },
        {
          role: "user",
          content: `Need: ${query}\n\nApps:\n${appLines.join("\n") || "(none)"}\n\nFlows:\n${flowLines.join("\n") || "(none)"}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const json = await res.json();
  const u = json.usage;
  console.info(`[ai-search] in ${u?.prompt_tokens} / out ${u?.completion_tokens} tokens, $${u?.cost}`);

  const content = String(json.choices?.[0]?.message?.content ?? "");
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  type Row = { id?: unknown; n?: unknown; why?: unknown };
  const parsed = JSON.parse(content.slice(start, end + 1)) as { apps?: Row[]; flows?: Row[]; results?: Row[] };
  // Ids carry their own kind, so tolerate items filed under the wrong key (or an old-style "results" list).
  const rows = [parsed.apps, parsed.flows, parsed.results].flatMap((list) => (Array.isArray(list) ? list : []));

  const out: Ranked = { tools: [], flows: [] };
  const seen = new Set<string>();
  for (const row of rows) {
    const match = /^([AF])(\d+)$/i.exec(String(row.id ?? row.n ?? "").trim());
    if (!match) continue;
    const isFlow = match[1].toUpperCase() === "F";
    const item = (isFlow ? flows : tools)[Number(match[2]) - 1];
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    // Swap any stray ids ("F1 chains…") for the item's name.
    const named = (text: string) =>
      text.replace(/\b([AF])(\d+)\b/g, (whole, kind: string, n: string) => {
        const ref = kind === "F" ? flows[Number(n) - 1]?.title : tools[Number(n) - 1]?.name;
        return ref ?? whole;
      });
    const why = typeof row.why === "string" && row.why.trim() ? named(row.why.trim()) : null;
    if (isFlow) {
      if (out.flows.length < MAX_FLOW_RESULTS) out.flows.push({ id: item.id, why });
    } else if (out.tools.length < MAX_RESULTS) out.tools.push({ id: item.id, why });
  }
  return out;
}

/**
 * Someone asking for "a tool" should still get tools. If the model only picked flows, ask again for apps
 * alone (a flow in the list tends to crowd them out); failing that, offer the apps the matched flows use.
 */
async function ensureApps(query: string, ids: Ranked, tools: CatalogTool[], flows: CatalogFlow[]) {
  if (ids.tools.length || !tools.length) return ids;
  const retry = await rankWithModel(query, tools, []).catch(() => null);
  if (retry?.tools.length) return { ...ids, tools: retry.tools };
  return { ...ids, tools: appsFromFlows(ids, tools, flows) };
}

function appsFromFlows(ids: Ranked, tools: CatalogTool[], flows: CatalogFlow[]) {
  const picked: Picked[] = [];
  for (const { id } of ids.flows) {
    const flow = flows.find((item) => item.id === id);
    for (const { tool } of flow?.stack ?? []) {
      if (picked.length >= MAX_RESULTS || picked.some((item) => item.id === tool.id)) continue;
      if (tools.some((candidate) => candidate.id === tool.id)) picked.push({ id: tool.id, why: `Part of the “${flow!.title}” flow.` });
    }
  }
  return picked;
}

const STOP = new Set("a an and the for to of in on with my me i we our you your is are that this it app apps tool tools need want help can which".split(" "));

// A few everyday equivalents the listings phrase differently.
const SYNONYMS: Record<string, string[]> = { email: ["mail", "inbox"], mail: ["email", "inbox"], photo: ["image", "shot"], image: ["photo"] };

/**
 * Lowercase query words minus stop words, crudely stemmed (long words keep all but their last 3 letters,
 * min 5) so "emailing", "emails" and Roman Urdu "emailen" all match "email". Synonyms are added on.
 */
function queryWords(query: string) {
  const stems = (query.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.length > 5 ? w.slice(0, Math.max(5, w.length - 3)) : w));
  return [...new Set(stems.flatMap((w) => [w, ...(SYNONYMS[w] ?? [])]))];
}

function keywordScore(query: string, tool: CatalogTool) {
  const words = queryWords(query);
  const fields: [string, number][] = [
    [tool.name, 5],
    [tool.tagline, 3],
    [tool.category.name, 3],
    [tool.seoKeywords ?? "", 3],
    [tool.description, 2],
    [tool.exampleScenario ?? "", 1],
    [tool.body, 1],
  ];
  let score = 0;
  for (const word of words) for (const [text, weight] of fields) if (text.toLowerCase().includes(word)) score += weight;
  if (/\bfree\b/i.test(query) && NO_COST_TO_START.includes(tool.pricing)) score += 2;
  return score;
}

function flowScore(query: string, flow: CatalogFlow) {
  const words = queryWords(query);
  const fields: [string, number][] = [
    [flow.title, 5],
    [flow.summary, 3],
    [flow.category.name, 3],
    [flow.stack.map((item) => item.tool.name).join(" "), 3],
    [flow.steps.map((step) => step.title).join(" "), 2],
  ];
  let score = 0;
  for (const word of words) for (const [text, weight] of fields) if (text.toLowerCase().includes(word)) score += weight;
  return score;
}

function rank<T>(query: string, items: T[], score: (query: string, item: T) => number) {
  return [...items].sort((a, b) => score(query, b) - score(query, a));
}

function clip(text: string, max: number) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
