/** URL parameters the product grid understands; anything else in the address is ignored. */
export const FILTER_KEYS = ["q", "size", "color", "minPrice", "maxPrice", "sale", "sort"] as const;

export type SearchParams = Record<string, string | string[] | undefined>;

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Builds the backend query: fixed scope (category, collection) plus the shopper's filters. */
export function productQuery(scope: Record<string, string>, params: SearchParams, pageSize = 24): URLSearchParams {
  const query = new URLSearchParams(scope);
  for (const key of FILTER_KEYS) {
    const value = first(params[key]);
    if (value) query.set(key, value);
  }
  query.set("pageSize", String(pageSize));
  return query;
}

export const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export const PRICE_BANDS = [
  { label: "Under ৳1,000", min: undefined, max: 999 },
  { label: "৳1,000 – ৳2,000", min: 1000, max: 2000 },
  { label: "৳2,000 – ৳3,000", min: 2000, max: 3000 },
  { label: "Over ৳3,000", min: 3000, max: undefined },
] as const;
