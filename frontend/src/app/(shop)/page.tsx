import Link from "next/link";
import { ArrowRight, Banknote, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { site } from "@/config/site";
import type { Collection } from "@/lib/types";
import { ProductRail } from "@/components/shop/ProductRail";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { SectionHeading } from "@/components/shop/SectionHeading";

/* eslint-disable @next/next/no-img-element */
export default async function HomePage() {
  const home = await api.home();
  const [hero, ...editorials] = home.collections;

  return (
    <>
      {hero && <Hero collection={hero} />}

      <section className="container-page pt-20 md:pt-28" aria-labelledby="shop-by">
        <SectionHeading eyebrow="Shop by" title="Find your fit" />
        <h2 id="shop-by" className="sr-only">Shop by category</h2>
        <div className="grid gap-3 sm:grid-cols-3 md:gap-5">
          {home.categories.map((category, i) => (
            <Link
              key={category.id}
              href={`/c/${category.slug}`}
              className="group relative block overflow-hidden bg-sand animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="aspect-[4/5]">
                {category.image && (
                  <img src={category.image} alt="" className="h-full w-full object-cover transition duration-[1.2s] ease-out-soft group-hover:scale-105" />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink/55 via-ink/15 to-transparent p-5 pt-24 text-paper md:p-7">
                <div>
                  <p className="font-display text-3xl font-light md:text-4xl">{category.name}</p>
                  <p className="mt-1 text-xs text-paper/80">{category.productCount} styles</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-paper text-ink transition group-hover:bg-clay group-hover:text-paper">
                  <ArrowRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pt-20 md:pt-28">
        <SectionHeading eyebrow="Just landed" title="New arrivals" href="/shop?sort=newest" />
        <ProductRail products={home.newArrivals} />
      </section>

      {editorials[0] && <Editorial collection={editorials[0]} />}

      <section className="container-page pt-20 md:pt-28">
        <SectionHeading eyebrow="Most loved" title="Best sellers" href="/shop?sort=popular" />
        <ProductGrid products={home.bestSellers} eager={0} />
      </section>

      <Promises />

      {editorials[1] && <Editorial collection={editorials[1]} reverse />}
    </>
  );
}

function Hero({ collection }: { collection: Collection }) {
  return (
    <section className="grid lg:h-[min(calc(100dvh-7rem),52rem)] lg:min-h-[38rem] lg:grid-cols-12">
      <div className="relative order-2 flex items-center bg-sand lg:order-1 lg:col-span-5">
        <div className="container-page max-w-xl animate-fade-up py-12 lg:py-20 lg:pl-12 xl:pl-16">
          <p className="eyebrow text-clay">{collection.name} · 2026</p>
          <h1 className="mt-5 font-display text-5xl font-light leading-[1.02] tracking-tight md:text-6xl xl:text-7xl">
            {collection.tagline}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">{collection.description}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={`/collections/${collection.slug}`} className="group inline-flex items-center gap-3 bg-ink px-7 py-4 text-sm font-medium text-paper transition hover:bg-clay">
              Shop the edit <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/shop?sort=newest" className="inline-flex items-center border border-ink px-7 py-4 text-sm font-medium transition hover:bg-ink hover:text-paper">
              New in
            </Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-ink/15 pt-6 text-xs">
            <div><dt className="text-muted">Styles</dt><dd className="mt-1 font-display text-2xl">{collection.productCount}</dd></div>
            <div><dt className="text-muted">Sizes</dt><dd className="mt-1 font-display text-2xl">XS–XXL</dd></div>
            <div><dt className="text-muted">Delivery</dt><dd className="mt-1 font-display text-2xl">2–4 days</dd></div>
          </dl>
        </div>
      </div>
      <div className="relative order-1 aspect-[4/3] overflow-hidden bg-sand lg:order-2 lg:col-span-7 lg:aspect-auto">
        {collection.image && <img src={collection.image} alt={collection.name} className="absolute inset-0 h-full w-full object-cover" />}
      </div>
    </section>
  );
}

function Editorial({ collection, reverse = false }: { collection: Collection; reverse?: boolean }) {
  return (
    <section className="container-page pt-20 md:pt-28">
      <div className={`grid items-stretch overflow-hidden bg-sand md:grid-cols-2 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
        <div className="relative aspect-[16/11] md:aspect-auto md:min-h-[32rem]">
          {collection.image && <img src={collection.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        </div>
        <div className="flex flex-col justify-center p-8 md:p-14 xl:p-20">
          <p className="eyebrow text-clay">The collection</p>
          <h2 className="mt-4 font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">{collection.name}</h2>
          <p className="mt-2 font-display text-xl font-light italic text-ink-soft">{collection.tagline}</p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">{collection.description}</p>
          <Link href={`/collections/${collection.slug}`} className="group mt-8 inline-flex w-fit items-center gap-3 border-b border-ink pb-1 text-sm font-medium">
            Explore {collection.productCount} styles <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Promises() {
  const items = [
    { icon: Truck, title: "Free delivery", text: `On orders over ৳${site.freeDeliveryOver.toLocaleString("en-IN")}, anywhere in Bangladesh.` },
    { icon: Banknote, title: "Cash on delivery", text: "Pay when your parcel arrives. No advance needed." },
    { icon: RefreshCcw, title: "7-day exchange", text: "Wrong size? Swap it within a week, free." },
    { icon: ShieldCheck, title: "Secure checkout", text: "Cards, bKash and Nagad through SSLCommerz." },
  ];
  return (
    <section className="container-page pt-20 md:pt-28">
      <ul className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="bg-paper p-6 md:p-8">
            <Icon size={22} strokeWidth={1.4} className="text-clay" />
            <p className="mt-4 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
