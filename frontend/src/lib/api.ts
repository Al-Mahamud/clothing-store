import "server-only";
import { notFound } from "next/navigation";
import type { CategoryNode, Collection, Home, ProductCard, ProductDetail, ProductPage } from "./types";

const backend = process.env.BACKEND_URL ?? "http://localhost:8080";

/** Catalog reads from server components. Cached briefly: catalog data changes rarely. */
async function get<T>(path: string, revalidate = 30): Promise<T> {
  const response = await fetch(`${backend}/api/v1${path}`, { next: { revalidate } });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
  return (await response.json()) as T;
}

export const api = {
  home: () => get<Home>("/home"),
  categories: () => get<CategoryNode[]>("/categories", 300),
  category: (slug: string) => get<CategoryNode>(`/categories/${encodeURIComponent(slug)}`),
  collections: () => get<Collection[]>("/collections", 300),
  collection: (slug: string) => get<Collection>(`/collections/${encodeURIComponent(slug)}`),
  products: (query: URLSearchParams) => get<ProductPage>(`/products?${query}`),
  product: (slug: string) => get<ProductDetail>(`/products/${encodeURIComponent(slug)}`),
  related: (slug: string) => get<ProductCard[]>(`/products/${encodeURIComponent(slug)}/related`),
};
