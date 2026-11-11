"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import type { CategoryNode, Collection } from "@/lib/types";
import { Drawer } from "@/components/ui/Drawer";

export function MobileMenu({ categories, collections }: { categories: CategoryNode[]; collections: Collection[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(categories[0]?.id ?? null);
  const pathname = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand lg:hidden">
        <Menu size={22} strokeWidth={1.6} />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} side="left" label="Menu">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <span className="eyebrow">Menu</span>
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 py-4">
          {categories.map((top) => (
            <div key={top.id} className="border-b border-line">
              <button
                type="button"
                aria-expanded={expanded === top.id}
                onClick={() => setExpanded(expanded === top.id ? null : top.id)}
                className="flex w-full items-center justify-between py-4 font-display text-2xl font-light"
              >
                {top.name}
                <ChevronDown size={18} className={`transition-transform ${expanded === top.id ? "rotate-180" : ""}`} />
              </button>
              {expanded === top.id && (
                <ul className="space-y-3 pb-5">
                  <li><Link href={`/c/${top.slug}`} className="text-sm font-medium">Shop all {top.name.toLowerCase()}</Link></li>
                  {top.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/c/${child.slug}`} className="text-sm text-ink-soft">{child.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="space-y-4 py-6">
            {collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.slug}`} className="block text-sm font-medium">{c.name}</Link>
            ))}
            <Link href="/shop?sale=true" className="block text-sm font-medium text-sale">Sale</Link>
          </div>
        </nav>
        <div className="grid grid-cols-2 gap-3 border-t border-line p-5 text-sm">
          <Link href="/account" className="border border-ink py-3 text-center font-medium">Account</Link>
          <Link href="/track" className="border border-line py-3 text-center font-medium">Track order</Link>
        </div>
      </Drawer>
    </>
  );
}
