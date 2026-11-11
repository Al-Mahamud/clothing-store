"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { CartLine } from "@/lib/types";
import { taka } from "@/lib/money";
import { ApiError } from "@/lib/client";
import { useCart } from "./CartProvider";

const problems = {
  UNAVAILABLE: "No longer available — please remove it.",
  OUT_OF_STOCK: "Sold out — please remove it.",
  NOT_ENOUGH_STOCK: "Fewer left than you chose — please lower the quantity.",
} as const;

/* eslint-disable @next/next/no-img-element */
export function CartLines({ lines, compact = false }: { lines: CartLine[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {lines.map((line) => (
        <Line key={line.variantId} line={line} compact={compact} />
      ))}
    </ul>
  );
}

function Line({ line, compact }: { line: CartLine; compact: boolean }) {
  const { setQuantity, remove, setOpen } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const change = async (action: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  };

  const maxQuantity = Math.min(10, line.stock);
  return (
    <li className={`flex gap-4 py-5 transition-opacity ${pending ? "opacity-50" : ""}`}>
      <Link href={`/p/${line.slug}?color=${encodeURIComponent(line.color.toLowerCase())}`} onClick={() => setOpen(false)} className={`shrink-0 overflow-hidden bg-sand ${compact ? "w-20" : "w-24 md:w-32"}`}>
        <div className="aspect-[3/4]">
          {line.image && <img src={line.image} alt="" className="h-full w-full object-cover" />}
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/p/${line.slug}`} onClick={() => setOpen(false)} className="text-sm font-medium leading-snug hover:underline underline-offset-4">
              {line.name}
            </Link>
            <p className="mt-1 text-xs text-muted">
              {line.color} · Size {line.size}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Remove ${line.name}`}
            disabled={pending}
            onClick={() => change(() => remove(line.variantId))}
            className="-mr-2 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={pending || line.quantity <= 1}
              onClick={() => change(() => setQuantity(line.variantId, line.quantity - 1))}
              className="grid h-9 w-9 place-items-center disabled:text-muted/40"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{line.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={pending || line.quantity >= maxQuantity}
              onClick={() => change(() => setQuantity(line.variantId, line.quantity + 1))}
              className="grid h-9 w-9 place-items-center disabled:text-muted/40"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium tabular-nums">{taka(line.lineTotal)}</p>
            {line.quantity > 1 && <p className="text-xs text-muted tabular-nums">{taka(line.unitPrice)} each</p>}
          </div>
        </div>
        {(line.problem || error) && (
          <p role="alert" className="mt-2 text-xs text-sale">{error ?? (line.problem ? problems[line.problem] : null)}</p>
        )}
      </div>
    </li>
  );
}
