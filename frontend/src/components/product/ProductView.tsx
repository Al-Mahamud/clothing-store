"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Heart, RefreshCcw, Truck } from "lucide-react";
import type { ProductDetail } from "@/lib/types";
import { site } from "@/config/site";
import { taka } from "@/lib/money";
import { Price } from "@/components/ui/Price";
import { Gallery } from "./Gallery";
import { SizeGuide } from "./SizeGuide";
import { AddToBag } from "./AddToBag";

const LOW_STOCK = 3;

export function ProductView({ product, initialColor }: { product: ProductDetail; initialColor?: string }) {
  const startColor = product.colors.find((c) => c.name.toLowerCase() === initialColor?.toLowerCase()) ?? product.colors[0];
  const [colorId, setColorId] = useState(startColor?.id);
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const variant = color?.sizes.find((s) => s.size === size) ?? null;
  const allSoldOut = useMemo(() => product.colors.every((c) => c.sizes.every((s) => s.stock === 0)), [product]);

  const chooseColor = (id: number) => {
    setColorId(id);
    const next = product.colors.find((c) => c.id === id);
    // Keep the chosen size if the new colour has it in stock.
    if (size && !next?.sizes.some((s) => s.size === size && s.stock > 0)) setSize(null);
    if (next) {
      const url = new URL(window.location.href);
      url.searchParams.set("color", next.name.toLowerCase());
      window.history.replaceState(null, "", url);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
      <div className="lg:col-span-7 xl:col-span-8">
        <Gallery key={color?.id} images={color?.images ?? []} name={product.name} />
      </div>

      <div className="lg:col-span-5 xl:col-span-4">
        <div className="lg:sticky lg:top-28">
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-ink">Home</Link></li>
              {product.breadcrumb.map((c) => (
                <li key={c.slug} className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  <Link href={`/c/${c.slug}`} className="hover:text-ink">{c.name}</Link>
                </li>
              ))}
            </ol>
          </nav>

          {product.isNew && <p className="eyebrow mt-6 text-clay">New arrival</p>}
          <h1 className={`font-display text-3xl font-light leading-tight tracking-tight md:text-4xl ${product.isNew ? "mt-2" : "mt-6"}`}>
            {product.name}
          </h1>
          <div className="mt-3">
            <Price price={product.price} compareAt={product.compareAtPrice} size="lg" />
          </div>
          <p className="mt-1 text-xs text-muted">Price includes VAT. Delivery calculated at checkout.</p>

          {color && (
            <fieldset className="mt-8">
              <legend className="text-sm">
                <span className="text-muted">Colour:</span> <span className="font-medium">{color.name}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.colors.map((c) => {
                  const out = c.sizes.every((s) => s.stock === 0);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => chooseColor(c.id)}
                      aria-pressed={c.id === color.id}
                      aria-label={`${c.name}${out ? " (sold out)" : ""}`}
                      title={c.name}
                      className={`relative h-9 w-9 rounded-full ring-offset-[3px] ring-offset-paper transition ${
                        c.id === color.id ? "ring-[1.5px] ring-ink" : "ring-1 ring-black/10 hover:ring-ink/40"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {out && <span className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink/60" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {color && color.sizes.length > 0 && (
            <fieldset className="mt-8">
              <div className="flex items-center justify-between">
                <legend className="text-sm">
                  <span className="text-muted">Size:</span> <span className="font-medium">{size ?? "Choose a size"}</span>
                </legend>
                {product.sizeChart !== "NONE" && <SizeGuide chart={product.sizeChart} fit={product.fit} />}
              </div>
              <div className={`mt-3 grid grid-cols-5 gap-2 ${sizeError ? "animate-[fade-up_0.3s]" : ""}`}>
                {color.sizes.map((s) => {
                  const out = s.stock === 0;
                  const selected = s.size === size;
                  return (
                    <button
                      key={s.variantId}
                      type="button"
                      disabled={out}
                      aria-pressed={selected}
                      onClick={() => {
                        setSize(s.size);
                        setSizeError(false);
                      }}
                      className={`relative h-12 overflow-hidden border text-sm font-medium transition ${
                        selected
                          ? "border-ink bg-ink text-paper"
                          : out
                            ? "cursor-not-allowed border-line text-muted/50"
                            : "border-line bg-white/50 hover:border-ink"
                      }`}
                    >
                      {s.size}
                      {out && (
                        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-0.5px),var(--color-line)_50%,transparent_calc(50%+0.5px))]" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 min-h-5 text-xs" role="status">
                {sizeError ? (
                  <span className="text-sale">Please choose a size first.</span>
                ) : variant && variant.stock <= LOW_STOCK ? (
                  <span className="text-clay">Only {variant.stock} left in {variant.size} — order soon.</span>
                ) : variant ? (
                  <span className="text-ok">In stock, ready to dispatch.</span>
                ) : null}
              </p>
            </fieldset>
          )}

          <div className="mt-4 flex gap-2">
            <AddToBag
              variantId={variant?.variantId ?? null}
              soldOut={allSoldOut}
              onMissingSize={() => setSizeError(true)}
            />
            <button type="button" aria-label="Save to wishlist" className="grid h-14 w-14 shrink-0 place-items-center border border-line transition hover:border-ink">
              <Heart size={20} strokeWidth={1.6} />
            </button>
          </div>

          <ul className="mt-8 space-y-3 border-y border-line py-6 text-sm">
            <li className="flex gap-3">
              <Truck size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-clay" />
              <span>
                Inside Dhaka 1–2 days ({taka(site.deliveryFees.insideDhaka)}), outside Dhaka 2–4 days ({taka(site.deliveryFees.outsideDhaka)}).
                <span className="text-muted"> Free over {taka(site.freeDeliveryOver)}.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <Banknote size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-clay" />
              Cash on delivery available everywhere in Bangladesh.
            </li>
            <li className="flex gap-3">
              <RefreshCcw size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-clay" />
              Free size exchange within 7 days.
            </li>
          </ul>

          <div className="divide-y divide-line border-b border-line">
            <Accordion title="Description" defaultOpen>
              <p>{product.description}</p>
            </Accordion>
            {product.details.length > 0 && (
              <Accordion title="Details & fit">
                <ul className="list-disc space-y-1 pl-5">
                  {product.details.map((d) => <li key={d}>{d}</li>)}
                  {product.fit && <li>{product.fit}</li>}
                </ul>
              </Accordion>
            )}
            {(product.fabric || product.care) && (
              <Accordion title="Fabric & care">
                {product.fabric && <p><span className="font-medium text-ink">Fabric:</span> {product.fabric}</p>}
                {product.care && <p className="mt-2">{product.care}</p>}
              </Accordion>
            )}
            <Accordion title="Delivery & returns">
              <p>
                We dispatch within 24 hours. Pay by cash on delivery, card, bKash or Nagad. Unworn items with tags can be
                exchanged for another size within 7 days of delivery.
              </p>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="relative h-3 w-3">
          <span className="absolute left-0 top-1/2 h-px w-3 bg-ink" />
          <span className="absolute left-1/2 top-0 h-3 w-px bg-ink transition-transform group-open:scale-y-0" />
        </span>
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}
