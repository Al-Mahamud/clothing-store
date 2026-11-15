import type { Metadata } from "next";
import { api } from "@/lib/api";
import { first, type SearchParams } from "@/lib/listing";
import { ProductView } from "@/components/product/ProductView";
import { ProductRail } from "@/components/shop/ProductRail";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { site } from "@/config/site";
import { JsonLd, absolute, breadcrumbs } from "@/lib/jsonld";
import { Reviews } from "@/components/review/Reviews";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await api.product(slug);
  const image = product.colors[0]?.images[0]?.url;
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: { title: product.name, description: product.description, images: image ? [image] : [] },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [product, related, reviews] = await Promise.all([api.product(slug), api.related(slug), api.reviews(slug)]);
  const color = first((await searchParams).color);
  const fit = reviews.summary.fit;
  const fitTotal = fit.small + fit.trueToSize + fit.large;
  const fitNote = fitTotal < 2 ? null
    : fit.trueToSize >= fit.small && fit.trueToSize >= fit.large ? "fits true to size"
    : fit.small > fit.large ? "runs small" : "runs large";
  const inStock = product.colors.some((c) => c.sizes.some((s) => s.stock > 0));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.colors.flatMap((c) => c.images.map((i) => absolute(i.url))).slice(0, 4),
    url: absolute(`/p/${product.slug}`),
    brand: { "@type": "Brand", name: site.name },
    ...(product.fabric && { material: product.fabric }),
    color: product.colors.map((c) => c.name).join(", "),
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: product.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absolute(`/p/${product.slug}`),
    },
    ...(product.rating !== null && product.reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount, bestRating: 5, worstRating: 1 },
      review: reviews.items.slice(0, 5).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author },
        datePublished: r.createdAt.slice(0, 10),
        reviewBody: r.body,
        ...(r.title && { name: r.title }),
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      })),
    }),
  };

  return (
    <>
      <div className="container-page pt-4 md:pt-8">
        <ProductView product={product} initialColor={color} fitNote={fitNote} />
      </div>
      <div className="container-page pt-20 md:pt-28">
        <Reviews slug={product.slug} product={product.name} initial={reviews} />
      </div>
      {related.length > 0 && (
        <section className="container-page pt-20 md:pt-28">
          <SectionHeading eyebrow="Complete the look" title="You may also like" />
          <ProductRail products={related} />
        </section>
      )}
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, ...product.breadcrumb.map((c) => ({ name: c.name, path: `/c/${c.slug}` })), { name: product.name, path: `/p/${product.slug}` }])} />
    </>
  );
}
