"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { taka } from "@/lib/money";
import { useCart } from "./CartProvider";
import { CartLines } from "./CartLines";
import { CouponForm } from "./CouponForm";
import { FreeDeliveryBar } from "./FreeDeliveryBar";

export function CartPage() {
  const { cart } = useCart();
  if (!cart) {
    return <div className="container-page min-h-[50vh] py-16"><div className="h-10 w-48 animate-pulse bg-sand" /></div>;
  }
  if (cart.items.length === 0) {
    return (
      <div className="container-page grid min-h-[55vh] place-items-center py-16 text-center">
        <div>
          <h1 className="font-display text-4xl font-light">Your bag is empty</h1>
          <p className="mt-3 text-sm text-muted">Have a look around — we think you&rsquo;ll find something.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/c/men" className="border border-ink px-7 py-3.5 text-sm font-medium hover:bg-ink hover:text-paper">Shop men</Link>
            <Link href="/c/women" className="border border-ink px-7 py-3.5 text-sm font-medium hover:bg-ink hover:text-paper">Shop women</Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="font-display text-4xl font-light tracking-tight md:text-5xl">
        Your bag <span className="text-muted">({cart.itemCount})</span>
      </h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7 xl:col-span-8">
          <FreeDeliveryBar cart={cart} />
          <CartLines lines={cart.items} />
        </div>
        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="space-y-5 bg-sand/60 p-6 lg:sticky lg:top-28 md:p-8">
            <h2 className="eyebrow">Order summary</h2>
            <CouponForm cart={cart} />
            <dl className="space-y-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{taka(cart.subtotal)}</dd></div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-ok"><dt>Discount</dt><dd className="tabular-nums">−{taka(cart.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-muted">{cart.coupon?.freeShipping || cart.remainingForFreeDelivery === 0 ? "Free" : "From ৳70"}</dd></div>
            </dl>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-medium">Estimated total</span>
              <span className="text-xl font-medium tabular-nums">{taka(cart.total)}</span>
            </div>
            {cart.canCheckout ? (
              <Link href="/checkout" className="group flex w-full items-center justify-center gap-2 bg-ink py-4 text-sm font-medium text-paper hover:bg-clay">
                Checkout <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <p role="alert" className="text-sm text-sale">Some items need your attention before checkout.</p>
            )}
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><Lock size={12} /> Secure checkout · Cash on delivery available</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
