"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ProductCard } from "@/lib/types";
import { ProductCardView } from "./ProductCardView";

/** A horizontally scrolling row of products with arrow buttons on larger screens. */
export function ProductRail({ products }: { products: ProductCard[] }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div
        ref={track}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:-mx-8 md:gap-5 md:scroll-px-8 md:px-8 xl:-mx-12 xl:scroll-px-12 xl:px-12"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
            <ProductCardView product={p} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] hidden justify-between md:flex">
        <RailButton label="Previous" onClick={() => scroll(-1)}>
          <ArrowLeft size={18} />
        </RailButton>
        <RailButton label="Next" onClick={() => scroll(1)}>
          <ArrowRight size={18} />
        </RailButton>
      </div>
    </div>
  );
}

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto -mx-4 grid h-11 w-11 place-items-center rounded-full bg-paper/95 text-ink shadow-[0_6px_24px_-8px_rgba(0,0,0,0.25)] ring-1 ring-line transition hover:bg-ink hover:text-paper"
    >
      {children}
    </button>
  );
}
