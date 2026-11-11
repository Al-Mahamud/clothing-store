"use client";

import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { taka } from "@/lib/money";
import { useCart } from "./CartProvider";
import { CartLines } from "./CartLines";
import { FreeDeliveryBar } from "./FreeDeliveryBar";

export function CartDrawer() {
  const { cart, open, setOpen } = useCart();
  const empty = !cart || cart.items.length === 0;
  return (
    <Drawer open={open} onClose={() => setOpen(false)} label="Shopping bag">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <p className="eyebrow">Your bag {cart && cart.itemCount > 0 && <span className="text-muted">({cart.itemCount})</span>}</p>
        <button type="button" aria-label="Close bag" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand">
          <X size={20} />
        </button>
      </div>
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <ShoppingBag size={36} strokeWidth={1.2} className="text-muted" />
          <p className="font-display text-2xl font-light">Your bag is empty</p>
          <p className="text-sm text-muted">Find something you love — new pieces arrive every week.</p>
          <Link href="/shop?sort=newest" onClick={() => setOpen(false)} className="mt-2 bg-ink px-8 py-3.5 text-sm font-medium text-paper hover:bg-clay">
            Shop new arrivals
          </Link>
        </div>
      ) : (
        <>
          <FreeDeliveryBar cart={cart} />
          <div className="flex-1 overflow-y-auto px-5">
            <CartLines lines={cart.items} compact />
          </div>
          <div className="shrink-0 space-y-4 border-t border-line bg-paper p-5">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{taka(cart.subtotal)}</dd></div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-ok"><dt>Discount ({cart.coupon?.code})</dt><dd className="tabular-nums">−{taka(cart.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-muted">Calculated at checkout</dd></div>
            </dl>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-medium tabular-nums">{taka(cart.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={() => setOpen(false)} className="border border-ink py-3.5 text-center text-sm font-medium hover:bg-sand">
                View bag
              </Link>
              <Link
                href={cart.canCheckout ? "/checkout" : "/cart"}
                onClick={() => setOpen(false)}
                className="bg-ink py-3.5 text-center text-sm font-medium text-paper hover:bg-clay"
              >
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}
