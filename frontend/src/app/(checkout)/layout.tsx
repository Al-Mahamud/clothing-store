import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { site } from "@/config/site";
import { CartProvider } from "@/components/cart/CartProvider";

/** Checkout gets a quiet frame: no menus or offers, just the steps to finish the order. */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <header className="border-b border-line bg-paper">
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to bag</span>
          </Link>
          <Link href="/" className="font-display text-2xl uppercase tracking-[0.32em] md:text-3xl">{site.name}</Link>
          <p className="flex items-center justify-end gap-1.5 text-xs text-muted"><Lock size={13} /> <span className="hidden sm:inline">Secure checkout</span></p>
        </div>
      </header>
      <main id="main">{children}</main>
    </CartProvider>
  );
}
