import Link from "next/link";
import type { PaymentMethod, PaymentStatus } from "@/lib/admin-types";

export const btn = {
  primary: "inline-flex items-center justify-center gap-1.5 bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-50",
  accent: "inline-flex items-center justify-center gap-1.5 bg-clay px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50",
  ghost: "inline-flex items-center justify-center gap-1.5 border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-50",
  danger: "inline-flex items-center justify-center gap-1.5 bg-sale px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
  icon: "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink-soft transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40",
};

export const input = "w-full border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-ink";

export function PageHeader({ title, note, children }: { title: string; note?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-4xl font-light leading-none tracking-tight">{title}</h1>
        {note && <p className="mt-1.5 text-sm text-muted">{note}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({ title, action, className = "", children }: { title?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`border border-line bg-white p-4 md:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl font-light">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, href, tone = "plain" }: { label: string; value: React.ReactNode; note?: string; href?: string; tone?: "plain" | "warn" | "good" }) {
  const toneClass = tone === "warn" ? "border-clay/50 bg-clay/5" : tone === "good" ? "border-ok/30 bg-ok/5" : "border-line bg-white";
  const body = (
    <>
      <p className="eyebrow text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-light tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={`block border p-4 transition hover:border-ink ${toneClass}`}>{body}</Link>
  ) : (
    <div className={`border p-4 ${toneClass}`}>{body}</div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-line bg-white px-4 py-12 text-center text-sm text-muted">{children}</p>;
}

export function Loading() {
  return <div className="h-64 animate-pulse bg-white" aria-busy="true" />;
}

export function PaymentBadge({ method, status }: { method: PaymentMethod; status: PaymentStatus }) {
  const text = status === "REFUNDED" ? "Refunded" : status === "PAID" ? (method === "COD" ? "Cash paid" : "Paid online") : method === "COD" ? "Cash due" : "Unpaid";
  const tone = status === "PAID" ? "bg-ok/15 text-ok" : status === "REFUNDED" ? "bg-sand text-ink-soft" : method === "COD" ? "bg-paper text-ink-soft ring-1 ring-line" : "bg-sale/10 text-sale";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{text}</span>;
}

export function ZoneBadge({ zone }: { zone: "DHAKA" | "OUTSIDE" }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${zone === "DHAKA" ? "bg-sand text-ink" : "bg-clay/10 text-clay"}`}>
      {zone === "DHAKA" ? "Inside Dhaka" : "Courier"}
    </span>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  if (total <= pageSize) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <button type="button" className={btn.ghost} disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-muted">Page {page + 1} of {Math.ceil(total / pageSize)}</span>
      <button type="button" className={btn.ghost} disabled={(page + 1) * pageSize >= total} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

/** Tabs that filter a list, with an optional count bubble. */
export function FilterTabs<T extends string>({ tabs, value, counts, onChange, alert }: { tabs: { value: T; label: string; count?: string }[]; value: T; counts?: Record<string, number>; onChange: (value: T) => void; alert?: string }) {
  return (
    <div className="no-scrollbar -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      {tabs.map((t) => {
        const count = t.count ? counts?.[t.count] : undefined;
        const on = value === t.value;
        return (
          <button key={t.value} type="button" onClick={() => onChange(t.value)} aria-pressed={on} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${on ? "bg-ink text-paper" : "bg-white text-ink-soft ring-1 ring-line hover:text-ink"}`}>
            {t.label}
            {count ? <span className={`rounded-full px-1.5 text-xs ${on ? "bg-paper/20 text-paper" : t.value === alert ? "bg-sale text-white" : "bg-sand"}`}>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
