import type { Metadata } from "next";
import { Listing } from "@/components/shop/Listing";
import type { SearchParams } from "@/lib/listing";
import { api } from "@/lib/api";
import type { CategoryNode } from "@/lib/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await api.category(slug);
  return { title: category.name, description: category.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [category, tree] = await Promise.all([api.category(slug), api.categories()]);
  const parent = tree.find((top) => top.children.some((c) => c.slug === slug));
  const top: CategoryNode = parent ?? category;
  const crumbs = parent
    ? [{ name: parent.name, href: `/c/${parent.slug}` }, { name: category.name, href: `/c/${category.slug}` }]
    : [{ name: category.name, href: `/c/${category.slug}` }];
  return (
    <Listing
      scope={{ category: slug }}
      searchParams={await searchParams}
      eyebrow={parent ? parent.name : "Shop"}
      title={parent ? category.name : `${category.name}'s collection`}
      description={category.description}
      crumbs={crumbs}
      tabs={[
        { name: `All ${top.name.toLowerCase()}`, href: `/c/${top.slug}`, active: top.slug === slug },
        ...top.children.map((c) => ({ name: c.name, href: `/c/${c.slug}`, active: c.slug === slug })),
      ]}
    />
  );
}
