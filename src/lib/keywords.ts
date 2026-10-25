// SEO keywords for a listing: stored as one comma-separated string, edited as tags.
export const KEYWORD_LIMITS = { max: 15, maxLength: 40 } as const;

/** Splits on commas/new lines, trims, drops empties and case-insensitive duplicates, caps count and length. */
export function parseKeywords(raw: string | null | undefined) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of (raw ?? "").split(/[,\n]/)) {
    const keyword = part.replace(/\s+/g, " ").trim().slice(0, KEYWORD_LIMITS.maxLength);
    const key = keyword.toLowerCase();
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    out.push(keyword);
    if (out.length === KEYWORD_LIMITS.max) break;
  }
  return out;
}

/** Normalised storage form ("a, b, c"), or null when empty. */
export function joinKeywords(raw: string | string[] | null | undefined) {
  const list = Array.isArray(raw) ? parseKeywords(raw.join(",")) : parseKeywords(raw);
  return list.length ? list.join(", ") : null;
}
