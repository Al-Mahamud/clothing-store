"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

/** The bag icon in the header. Phase 3 connects it to the cart and opens the cart drawer. */
export function BagButton() {
  return (
    <Link href="/cart" aria-label="Shopping bag" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-sand">
      <ShoppingBag size={20} strokeWidth={1.6} />
    </Link>
  );
}
