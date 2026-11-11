"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";

const suggestions = ["Panjabi", "Linen", "Kurti", "Three-piece", "Jeans", "Kids"];

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (text: string) => {
    if (!text.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(text.trim())}`);
  };

  return (
    <>
      <button type="button" aria-label="Search" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand">
        <Search size={20} strokeWidth={1.6} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label="Search">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative animate-fade-up border-b border-line bg-paper">
            <form
              className="container-page flex items-center gap-4 py-6 md:py-10"
              onSubmit={(e) => {
                e.preventDefault();
                go(q);
              }}
            >
              <Search size={24} strokeWidth={1.4} className="shrink-0 text-muted" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search panjabis, kurtis, linen…"
                aria-label="Search the shop"
                className="min-w-0 flex-1 bg-transparent font-display text-2xl font-light outline-none placeholder:text-muted/60 md:text-4xl"
              />
              <button type="submit" aria-label="Search" className="hidden h-12 w-12 place-items-center rounded-full bg-ink text-paper sm:grid">
                <ArrowRight size={20} />
              </button>
              <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand">
                <X size={22} />
              </button>
            </form>
            <div className="container-page flex flex-wrap items-center gap-2 pb-8">
              <span className="eyebrow mr-2 text-muted">Popular</span>
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => go(s)} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
