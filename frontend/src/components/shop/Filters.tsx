"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { ProductPage } from "@/lib/types";
import { PRICE_BANDS, SORTS } from "@/lib/listing";
import { Drawer } from "@/components/ui/Drawer";

type Facets = ProductPage["facets"];

/** Reads and changes filter values in the address bar, so filtered pages can be shared and bookmarked. */
function useFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const search = next.toString();
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  };

  const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const toggle = (key: string, value: string) => {
    const current = list(key);
    const has = current.some((v) => v.toLowerCase() === value.toLowerCase());
    const next = has ? current.filter((v) => v.toLowerCase() !== value.toLowerCase()) : [...current, value];
    update({ [key]: next.join(",") || null });
  };

  return { params, update, list, toggle, pending };
}

export function FilterPanel({ facets }: { facets: Facets }) {
  const { params, update, toggle, pending } = useFilters();
  const min = params.get("minPrice");
  const max = params.get("maxPrice");
  const sale = params.get("sale") === "true";
  const any = ["size", "color", "minPrice", "maxPrice", "sale"].some((k) => params.get(k));

  return (
    <div className={`space-y-1 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <Section title="Size" defaultOpen>
        {facets.sizes.length === 0 ? (
          <p className="text-sm text-muted">No sizes in stock.</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {facets.sizes.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={s.selected}
                onClick={() => toggle("size", s.value)}
                className={`h-10 border text-xs font-medium transition ${
                  s.selected ? "border-ink bg-ink text-paper" : "border-line bg-white/50 hover:border-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="Colour" defaultOpen>
        <ul className="space-y-1">
          {facets.colors.map((c) => (
            <li key={c.value}>
              <button
                type="button"
                aria-pressed={c.selected}
                onClick={() => toggle("color", c.value.toLowerCase())}
                className="group flex w-full items-center gap-3 py-1.5 text-left text-sm"
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full ring-1 ring-offset-2 ring-offset-paper transition ${
                    c.selected ? "ring-ink" : "ring-black/10 group-hover:ring-ink/40"
                  }`}
                  style={{ backgroundColor: c.hex ?? undefined }}
                >
                  {c.selected && <Check size={12} className={c.value === "WHITE" || c.value === "BEIGE" ? "text-ink" : "text-white"} />}
                </span>
                <span className={c.selected ? "font-medium" : "text-ink-soft"}>{c.label}</span>
                <span className="ml-auto text-xs text-muted">{c.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Price" defaultOpen>
        <ul className="space-y-1">
          {PRICE_BANDS.map((band) => {
            const active = (min ?? "") === String(band.min ?? "") && (max ?? "") === String(band.max ?? "");
            return (
              <li key={band.label}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    update(
                      active
                        ? { minPrice: null, maxPrice: null }
                        : { minPrice: band.min?.toString() ?? null, maxPrice: band.max?.toString() ?? null },
                    )
                  }
                  className="flex w-full items-center gap-3 py-1.5 text-left text-sm"
                >
                  <span className={`grid h-4 w-4 place-items-center rounded-full border ${active ? "border-ink" : "border-muted/50"}`}>
                    {active && <span className="h-2 w-2 rounded-full bg-ink" />}
                  </span>
                  <span className={active ? "font-medium" : "text-ink-soft"}>{band.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">
          From ৳{facets.price.min.toLocaleString("en-IN")} to ৳{facets.price.max.toLocaleString("en-IN")}
        </p>
      </Section>

      <Section title="Offers" defaultOpen>
        <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm">
          <input
            type="checkbox"
            checked={sale}
            onChange={() => update({ sale: sale ? null : "true" })}
            className="h-4 w-4 accent-ink"
          />
          On sale
        </label>
      </Section>

      {any && (
        <button
          type="button"
          onClick={() => update({ size: null, color: null, minPrice: null, maxPrice: null, sale: null })}
          className="mt-4 text-sm underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="eyebrow">{title}</span>
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pt-4">{children}</div>}
    </div>
  );
}

export function MobileFilters({ facets, total }: { facets: Facets; total: number }) {
  const [open, setOpen] = useState(false);
  const { params } = useFilters();
  const count = ["size", "color"].reduce((n, k) => n + (params.get(k)?.split(",").filter(Boolean).length ?? 0), 0)
    + (params.get("minPrice") || params.get("maxPrice") ? 1 : 0) + (params.get("sale") ? 1 : 0);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-ink px-4 py-2 text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal size={15} /> Filter{count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.625rem] text-paper">{count}</span>}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} side="left" label="Filters">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <span className="eyebrow">Filter</span>
          <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <FilterPanel facets={facets} />
        </div>
        <div className="border-t border-line p-5">
          <button type="button" onClick={() => setOpen(false)} className="w-full bg-ink py-4 text-sm font-medium text-paper">
            Show {total} {total === 1 ? "style" : "styles"}
          </button>
        </div>
      </Drawer>
    </>
  );
}

export function SortSelect() {
  const { params, update } = useFilters();
  const value = params.get("sort") ?? "recommended";
  return (
    <label className="relative flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">Sort by</span>
      <select
        value={value}
        onChange={(e) => update({ sort: e.target.value === "recommended" ? null : e.target.value })}
        className="appearance-none bg-transparent py-2 pl-1 pr-7 font-medium outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-1" />
    </label>
  );
}

export function ActiveFilters({ facets }: { facets: Facets }) {
  const { params, update, toggle, list } = useFilters();
  const chips: { label: string; remove: () => void }[] = [];
  for (const size of list("size")) chips.push({ label: `Size ${size}`, remove: () => toggle("size", size) });
  for (const color of list("color")) {
    const facet = facets.colors.find((c) => c.value.toLowerCase() === color.toLowerCase());
    chips.push({ label: facet?.label ?? color, remove: () => toggle("color", color) });
  }
  const min = params.get("minPrice");
  const max = params.get("maxPrice");
  if (min || max) {
    const label = min && max ? `৳${min}–৳${max}` : min ? `Over ৳${min}` : `Under ৳${Number(max) + 1}`;
    chips.push({ label, remove: () => update({ minPrice: null, maxPrice: null }) });
  }
  if (params.get("sale")) chips.push({ label: "On sale", remove: () => update({ sale: null }) });
  if (chips.length === 0) return null;
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.remove}
          className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-xs font-medium hover:bg-line"
          aria-label={`Remove ${chip.label}`}
        >
          {chip.label} <X size={12} />
        </button>
      ))}
    </div>
  );
}
