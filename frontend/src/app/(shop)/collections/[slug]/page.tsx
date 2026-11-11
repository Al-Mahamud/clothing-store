import type { Metadata } from "next";
import { Listing } from "@/components/shop/Listing";
import type { SearchParams } from "@/lib/listing";
import { api } from "@/lib/api";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await api.collection(slug);
  return { title: collection.name, description: collection.description ?? undefined };
}

/* eslint-disable @next/next/no-img-element */
export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [collection, all] = await Promise.all([api.collection(slug), api.collections()]);
  return (
    <Listing
      scope={{ collection: slug }}
      searchParams={await searchParams}
      eyebrow={collection.tagline ?? "Collection"}
      title={collection.name}
      description={collection.description}
      crumbs={[{ name: collection.name, href: `/collections/${slug}` }]}
      tabs={all.map((c) => ({ name: c.name, href: `/collections/${c.slug}`, active: c.slug === slug }))}
      banner={
        collection.image ? (
          <div className="relative mt-6 aspect-[16/7] overflow-hidden bg-sand md:aspect-[16/5]">
            <img src={collection.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        ) : null
      }
    />
  );
}
