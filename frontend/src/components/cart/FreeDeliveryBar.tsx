import { Truck } from "lucide-react";
import { taka } from "@/lib/money";
import type { Cart } from "@/lib/types";

export function FreeDeliveryBar({ cart }: { cart: Cart }) {
  const done = cart.remainingForFreeDelivery === 0;
  const progress = done ? 100 : Math.min(100, (cart.total / cart.freeDeliveryOver) * 100);
  return (
    <div className="bg-sand px-4 py-3">
      <p className="flex items-center gap-2 text-xs">
        <Truck size={15} strokeWidth={1.6} className="text-clay" />
        {done ? (
          <span><strong className="font-semibold">You&rsquo;ve unlocked free delivery.</strong></span>
        ) : (
          <span>
            Add <strong className="font-semibold">{taka(cart.remainingForFreeDelivery)}</strong> more for free delivery
          </span>
        )}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-clay transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
