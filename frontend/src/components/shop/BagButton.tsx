"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export function BagButton() {
  const { cart, setOpen } = useCart();
  const count = cart?.itemCount ?? 0;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-sand"
    >
      <ShoppingBag size={20} strokeWidth={1.6} />
      {count > 0 && (
        <span key={count} className="absolute right-0.5 top-0.5 grid h-[1.125rem] min-w-[1.125rem] animate-fade-up place-items-center rounded-full bg-clay px-1 text-[0.625rem] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
