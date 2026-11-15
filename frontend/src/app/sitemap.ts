import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { api } from "@/lib/api";
import { site } from "@/config/site";
import { pageSlugs } from "@/config/pages";

/** Every page worth finding: home, the shop, categories, collections, products and information pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Built when asked for, not at build time (no shop API then); the product list is cached for an hour.
  await connection();
  const data = await api.sitemap().catch(() => ({ categories: [], collections: [], products: [] }));
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/shop`, changeFrequency: "daily", priority: 0.8 },
    ...data.categories.map((slug) => ({ url: `${site.url}/c/${slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...data.collections.map((slug) => ({ url: `${site.url}/collections/${slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...data.products.map((p) => ({ url: `${site.url}/p/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...pageSlugs.map((slug) => ({ url: `${site.url}/pages/${slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
