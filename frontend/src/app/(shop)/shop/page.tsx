import type { Metadata } from "next";
import { Listing } from "@/components/shop/Listing";
import { first, type SearchParams } from "@/lib/listing";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Shop all" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const categories = await api.categories();
  const sale = first(params.sale) === "true";
  const sort = first(params.sort);
  const title = sale ? "Sale" : sort === "newest" ? "New arrivals" : sort === "popular" ? "Best sellers" : "Shop all";
  return (
    <Listing
      scope={{}}
      searchParams={params}
      eyebrow={sale ? "Limited time" : "The full range"}
      title={title}
      description={sale ? "Quiet reductions on pieces we love. While sizes last." : null}
      crumbs={[{ name: title, href: "/shop" }]}
      tabs={[
        { name: "All", href: "/shop", active: true },
        ...categories.map((c) => ({ name: c.name, href: `/c/${c.slug}`, active: false })),
      ]}
    />
  );
}
