import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/console/", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://www.conqueror-studios.com/sitemap.xml",
  };
}
