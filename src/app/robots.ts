import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or personal pages have no value in search results.
      disallow: [
        "/api/",
        "/auth/",
        "/*/settings",
        "/*/feed",
        "/*/login",
        "/*/signup",
        "/*/forgot-password",
        "/*/reset-password",
        "/*/lists/new",
        "/*/lists/*/edit",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
