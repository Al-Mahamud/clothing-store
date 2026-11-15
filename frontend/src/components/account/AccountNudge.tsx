"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useAccount } from "./AccountProvider";

/** After a guest order: suggest an account (the order joins it when they sign up with this number). */
export function AccountNudge() {
  const { me } = useAccount();
  if (me !== null) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-5 border border-line bg-sand p-6 md:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-ink/15 text-clay"><Heart size={20} strokeWidth={1.6} /></span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-light">Keep track of your orders</p>
        <p className="mt-1 text-sm text-muted">Create an account with this mobile number and this order joins it, with a wishlist and saved addresses.</p>
      </div>
      <Link href="/register?next=/account" className="bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-clay">Create an account</Link>
    </div>
  );
}
