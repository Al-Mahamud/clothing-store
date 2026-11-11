"use client";

import { ShoppingBag } from "lucide-react";

/** Phase 3 connects this button to the cart. */
export function AddToBag({
  variantId,
  soldOut,
  onMissingSize,
}: {
  variantId: number | null;
  soldOut: boolean;
  onMissingSize: () => void;
}) {
  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => {
        if (variantId === null) onMissingSize();
      }}
      className="flex h-14 flex-1 items-center justify-center gap-2 bg-ink text-sm font-medium text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:bg-muted"
    >
      <ShoppingBag size={18} strokeWidth={1.6} />
      {soldOut ? "Sold out" : "Add to bag"}
    </button>
  );
}
