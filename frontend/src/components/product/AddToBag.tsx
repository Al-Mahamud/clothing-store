"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { ApiError } from "@/lib/client";

export function AddToBag({
  variantId,
  soldOut,
  onMissingSize,
}: {
  variantId: number | null;
  soldOut: boolean;
  onMissingSize: () => void;
}) {
  const { add } = useCart();
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    if (variantId === null) {
      onMissingSize();
      return;
    }
    setState("adding");
    setError(null);
    try {
      await add(variantId, 1);
      setState("added");
      setTimeout(() => setState("idle"), 1800);
    } catch (e) {
      setState("idle");
      setError(e instanceof ApiError ? e.message : "Couldn't add to your bag. Please try again.");
    }
  };

  return (
    <div className="flex-1">
      <button
        type="button"
        disabled={soldOut || state === "adding"}
        onClick={onClick}
        className="flex h-14 w-full items-center justify-center gap-2 bg-ink text-sm font-medium text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:bg-muted"
      >
        {state === "added" ? <Check size={18} /> : <ShoppingBag size={18} strokeWidth={1.6} />}
        {soldOut ? "Sold out" : state === "adding" ? "Adding…" : state === "added" ? "Added to bag" : "Add to bag"}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-sale">{error}</p>}
    </div>
  );
}
