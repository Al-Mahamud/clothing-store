import type { Metadata } from "next";
import { api } from "@/lib/api";
import { first, type SearchParams } from "@/lib/listing";
import { ProductView } from "@/components/product/ProductView";
import { ProductRail } from "@/components/shop/ProductRail";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { site } from "@/config/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await api.product(slug);
  const image = product.colors[0]?.images[0]?.url;
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { title: product.name, description: product.description, images: image ? [image] : [] },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [product, related] = await Promise.all([api.product(slug), api.related(slug)]);
  const color = first((await searchParams).color);
  const inStock = product.colors.some((c) => c.sizes.some((s) => s.stock > 0));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.colors.flatMap((c) => c.images.map((i) => i.url)).slice(0, 4),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: product.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <div className="container-page pt-4 md:pt-8">
        <ProductView product={product} initialColor={color} />
      </div>
      {related.length > 0 && (
        <section className="container-page pt-20 md:pt-28">
          <SectionHeading eyebrow="Complete the look" title="You may also like" />
          <ProductRail products={related} />
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
