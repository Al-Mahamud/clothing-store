"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "./WishlistProvider";

/** The heart: on product cards (small, over the photo) and on the product page (large). */
export function SaveButton({ productId, name, size = "card" }: { productId: number; name: string; size?: "card" | "page" }) {
  const { saved, toggle } = useWishlist();
  const on = saved(productId);
  const label = on ? `Remove ${name} from your wishlist` : `Save ${name} to your wishlist`;
  if (size === "page") {
    return (
      <button type="button" aria-label={label} aria-pressed={on} onClick={() => toggle(productId, name)} className={`grid h-14 w-14 shrink-0 place-items-center border transition ${on ? "border-ink text-clay" : "border-line hover:border-ink"}`}>
        <Heart size={20} strokeWidth={1.7} fill={on ? "currentColor" : "none"} />
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        void toggle(productId, name);
      }}
      className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${on ? "bg-paper text-clay" : "bg-paper/85 text-ink hover:bg-paper"}`}
    >
      <Heart size={16} strokeWidth={1.8} fill={on ? "currentColor" : "none"} />
    </button>
  );
}
