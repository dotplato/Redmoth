import type { Pricing } from "@prisma/client";

export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "ToolsMade";

export const SITE_DESCRIPTION =
  "Discover the best AI tools and the workflows people build with them. Compare apps by price and category, read real reviews and examples, and visit each tool's own site.";

/** Public origin with no trailing slash, used for canonical URLs, the sitemap and structured data. */
export function siteUrl() {
  return (process.env.PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Trims to a search-snippet friendly length on a word boundary. */
export function snippet(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 60 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

/** robots metadata for pages that should stay out of the index but still pass link equity. */
export const NOINDEX = { robots: { index: false, follow: true } } as const;

/** schema.org Offer for models that are free to start; we don't store real prices for paid plans. */
export function pricingOffer(pricing: Pricing) {
  if (pricing !== "FREE" && pricing !== "FREEMIUM" && pricing !== "FREE_TRIAL") return undefined;
  return { "@type": "Offer", price: "0", priceCurrency: "USD" };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
