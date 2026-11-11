import Link from "next/link";
import type { ProductCard } from "@/lib/types";
import { percentOff } from "@/lib/money";
import { Price } from "@/components/ui/Price";

/* eslint-disable @next/next/no-img-element -- product images are served by the backend as-is. */
export function ProductCardView({ product, priority = false }: { product: ProductCard; priority?: boolean }) {
  const off = percentOff(product.price, product.compareAtPrice);
  const extraColors = product.colors.length - 4;
  return (
    <article className="group relative">
      <Link href={`/p/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-sand">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out-soft group-hover:scale-[1.03]"
            />
          )}
          {product.hoverImage && (
            <img
              src={product.hoverImage}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 ease-out-soft group-hover:opacity-100"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.soldOut ? (
              <Badge tone="ink">Sold out</Badge>
            ) : off ? (
              <Badge tone="sale">−{off}%</Badge>
            ) : null}
            {product.isNew && !product.soldOut && <Badge tone="paper">New</Badge>}
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">{product.category}</p>
          <h3 className="text-sm leading-snug text-ink decoration-1 underline-offset-4 group-hover:underline">
            {product.name}
          </h3>
          <Price price={product.price} compareAt={product.compareAtPrice} />
        </div>
      </Link>
      {product.colors.length > 1 && (
        <div className="mt-2 flex items-center gap-1.5" aria-label={`${product.colors.length} colours`}>
          {product.colors.slice(0, 4).map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="h-3 w-3 rounded-full ring-1 ring-black/10 ring-offset-1 ring-offset-paper"
              style={{ backgroundColor: c.hex }}
            />
          ))}
          {extraColors > 0 && <span className="text-[0.6875rem] text-muted">+{extraColors}</span>}
        </div>
      )}
    </article>
  );
}

function Badge({ tone, children }: { tone: "ink" | "sale" | "paper"; children: React.ReactNode }) {
  const tones = {
    ink: "bg-ink text-paper",
    sale: "bg-sale text-white",
    paper: "bg-paper/90 text-ink backdrop-blur",
  };
  return (
    <span className={`px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] ${tones[tone]}`}>
      {children}
    </span>
  );
}
