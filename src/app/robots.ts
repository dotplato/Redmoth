import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Outbound redirects, APIs and signed-in screens have nothing for search to index.
      disallow: ["/api/", "/go/", "/admin", "/account", "/saved", "/flows/new", "/*/edit"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
