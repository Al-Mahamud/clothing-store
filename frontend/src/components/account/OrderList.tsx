"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package, RotateCcw } from "lucide-react";
import { request } from "@/lib/client";
import { taka } from "@/lib/money";
import type { OrderHistory, OrderSummary } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import { useReorder } from "./useReorder";

/* eslint-disable @next/next/no-img-element */
export function OrderList() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const { reorder, busy } = useReorder();

  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading a page of orders.
    setLoading(true);
    request<OrderHistory>("GET", `/account/orders?page=${page}`)
      .then((h) => {
        if (!live) return;
        setOrders((o) => (page === 0 ? h.items : [...(o ?? []), ...h.items]));
        setTotal(h.total);
      })
      .catch(() => live && setOrders((o) => o ?? []))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [page]);

  if (!orders) return <div className="h-64 animate-pulse bg-white/50" aria-busy="true" />;
  if (orders.length === 0) {
    return (
      <div className="grid place-items-center border border-line bg-white/50 px-6 py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-line text-clay"><Package size={26} strokeWidth={1.5} /></span>
        <h2 className="mt-4 font-display text-3xl font-light">No orders yet</h2>
        <p className="mt-1 max-w-xs text-sm text-muted">Everything you order shows up here, with its delivery status.</p>
        <Link href="/shop" className="mt-6 bg-ink px-8 py-3.5 text-sm font-medium text-paper transition hover:bg-clay">Start shopping</Link>
      </div>
    );
  }
  return (
    <section aria-label="Your orders">
      <ul className="divide-y divide-line border-y border-line">
        {orders.map((o) => (
          <li key={o.number} className="py-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link href={`/account/orders/${o.number}`} className="font-display text-2xl font-light hover:text-clay">{o.number}</Link>
              <StatusPill status={o.status} />
              <span className="ml-auto text-xs text-muted">{new Date(o.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                {o.images.map((src, i) => <span key={i} className="h-16 w-12 overflow-hidden border-2 border-paper bg-sand"><img src={src} alt="" className="h-full w-full object-cover" /></span>)}
                {o.lineCount > o.images.length && <span className="grid h-16 w-12 place-items-center border-2 border-paper bg-sand text-xs font-medium">+{o.lineCount - o.images.length}</span>}
              </div>
              <p className="min-w-0 flex-1 text-sm text-muted">{o.itemCount} piece{o.itemCount === 1 ? "" : "s"} · <strong className="text-ink tabular-nums">{taka(o.total)}</strong></p>
              <div className="flex w-full gap-2 sm:w-auto">
                <button type="button" onClick={() => reorder(o.number)} disabled={busy !== null} className="inline-flex flex-1 items-center justify-center gap-1.5 bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-clay disabled:opacity-60 sm:flex-none">
                  <RotateCcw size={15} /> {busy === o.number ? "Adding…" : "Order again"}
                </button>
                <Link href={`/account/orders/${o.number}`} className="inline-flex flex-1 items-center justify-center gap-0.5 border border-line px-5 py-2.5 text-sm font-medium hover:border-ink sm:flex-none">Details <ChevronRight size={15} /></Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {orders.length < total && (
        <div className="mt-5 text-center">
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={loading} className="border border-ink px-8 py-3 text-sm font-medium transition hover:bg-ink hover:text-paper disabled:opacity-50">{loading ? "Loading…" : "Show older orders"}</button>
        </div>
      )}
    </section>
  );
}
