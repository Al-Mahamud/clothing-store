"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ApiError, request } from "@/lib/client";
import type { StockRow } from "@/lib/admin-types";
import { taka } from "@/lib/money";
import { bySize } from "@/lib/sizes";
import { Empty, Loading, PageHeader, input } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/AdminShell";

const LOW = 3;

/** One number box; saves when it loses focus or Enter is pressed. */
function StockBox({ row, onSaved }: { row: StockRow; onSaved: (row: StockRow) => void }) {
  const { notify } = useAdmin();
  const [value, setValue] = useState(String(row.stock));
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const save = async () => {
    if (value.trim() === String(row.stock)) return;
    setState("saving");
    try {
      const saved = await request<StockRow>("PATCH", `/admin/variants/${row.variantId}/stock`, { stock: Number(value) });
      onSaved(saved);
      setValue(String(saved.stock));
      setState("idle");
      notify(`${row.product}, ${row.color} ${row.size}: ${saved.stock} in stock`);
    } catch (e) {
      setState("error");
      notify(e instanceof ApiError ? (Object.values(e.fields)[0] ?? e.message) : "Couldn't save.");
    }
  };
  const tone = state === "error" ? "border-sale" : row.stock === 0 ? "border-sale/40 bg-sale/5" : row.stock <= LOW ? "border-clay/50 bg-clay/10" : "";
  return (
    <span className="block">
      <input
        aria-label={`Stock of ${row.product}, ${row.color}, size ${row.size}`}
        inputMode="numeric"
        value={value}
        onChange={(e) => { setValue(e.target.value.replace(/[^0-9]/g, "")); setState("idle"); }}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`${input} mx-auto block max-w-16 px-1 text-center tabular-nums ${tone} ${state === "saving" ? "opacity-60" : ""}`}
      />
    </span>
  );
}

/* eslint-disable @next/next/no-img-element */
function Stock() {
  const params = useSearchParams();
  const [low, setLow] = useState(params.get("low") === "1");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<StockRow[] | null>(null);

  useEffect(() => {
    const query = new URLSearchParams();
    if (low) query.set("low", "true");
    if (q) query.set("q", q);
    request<StockRow[]>("GET", `/admin/stock?${query}`).then(setRows).catch(() => setRows([]));
  }, [low, q]);

  // Product → colour → size, so each product reads as a small grid with its own sizes as columns.
  const products = useMemo(() => {
    type Group = { id: number; name: string; image: string | null; status: string; price: number; sizes: string[]; colors: Map<string, { hex: string; cells: Record<string, StockRow> }> };
    const byProduct = new Map<number, Group>();
    for (const r of rows ?? []) {
      const product: Group = byProduct.get(r.productId) ?? { id: r.productId, name: r.product, image: r.image, status: r.status, price: r.price, sizes: [], colors: new Map() };
      if (!product.sizes.includes(r.size)) product.sizes.push(r.size);
      const color = product.colors.get(r.color) ?? { hex: r.hex, cells: {} };
      color.cells[r.size] = r;
      product.colors.set(r.color, color);
      byProduct.set(r.productId, product);
    }
    for (const p of byProduct.values()) p.sizes.sort(bySize);
    return [...byProduct.values()];
  }, [rows]);

  const replace = (saved: StockRow) => setRows((list) => list?.map((r) => (r.variantId === saved.variantId ? saved : r)) ?? null);

  return (
    <>
      <PageHeader title="Stock" note="Pieces ready to send, per colour and size. Type a number and press Enter." />
      <div className="mb-4 flex flex-wrap gap-2">
        <form className="relative min-w-60 flex-1" onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); }}>
          <label><span className="sr-only">Search</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product, colour or SKU" className={`${input} pl-9`} /></label>
        </form>
        <label className="flex items-center gap-2 border border-line bg-white px-3.5 text-sm"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} className="h-4 w-4 accent-ink" /> Only running low ({LOW} or fewer)</label>
      </div>
      {!rows ? <Loading /> : products.length === 0 ? <Empty>{low ? "Nothing is running low." : "No products match."}</Empty> : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {products.map((p) => (
            <li key={p.id} className="border border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-14 w-11 shrink-0 overflow-hidden bg-sand">{p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}</span>
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="block truncate font-medium hover:text-clay">{p.name}</Link>
                  <span className="text-xs text-muted tabular-nums">{taka(p.price)}</span>
                </span>
                {p.status === "DRAFT" && <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium">Draft</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted"><th className="pb-1.5 pr-2 text-left font-medium">Colour</th>{p.sizes.map((s) => <th key={s} className="min-w-14 pb-1.5 font-medium">{s}</th>)}</tr></thead>
                  <tbody>
                    {[...p.colors.entries()].map(([color, { hex, cells }]) => (
                      <tr key={color} className="border-t border-line">
                        <td className="py-2 pr-2 text-ink-soft"><span className="flex items-center gap-2 whitespace-nowrap"><span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: hex }} />{color}</span></td>
                        {p.sizes.map((s) => (
                          <td key={s} className="px-0.5 py-2 text-center align-top">
                            {cells[s] ? <StockBox key={cells[s].variantId} row={cells[s]} onSaved={replace} /> : <span className="text-xs text-muted">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function StockPage() {
  return <Suspense fallback={<Loading />}><Stock /></Suspense>;
}
