import type { MetadataRoute } from "next";

const BASE_URL = "https://conquerorstudios.dev";

const publicRoutes: { url: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { url: "/", priority: 1.0, changeFrequency: "weekly" },
  { url: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { url: "/agents", priority: 0.9, changeFrequency: "weekly" },
  { url: "/orchestrai", priority: 0.9, changeFrequency: "monthly" },
  { url: "/aibridge", priority: 0.9, changeFrequency: "monthly" },
  { url: "/voiceisolate", priority: 0.8, changeFrequency: "monthly" },
  { url: "/aicounselor", priority: 0.8, changeFrequency: "monthly" },
  { url: "/lovemenot", priority: 0.7, changeFrequency: "monthly" },
  { url: "/studio", priority: 0.7, changeFrequency: "monthly" },
  { url: "/waitlist", priority: 0.8, changeFrequency: "monthly" },
  { url: "/support", priority: 0.6, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE_URL}${url}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
