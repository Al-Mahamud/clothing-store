"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Lock } from "lucide-react";
import { ApiError, request } from "@/lib/client";
import { taka } from "@/lib/money";
import { site } from "@/config/site";
import type { Quote, Zone } from "@/lib/types";
import { useCart } from "./CartProvider";

type Form = {
  name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  zone: Zone;
  note: string;
  paymentMethod: "COD" | "ONLINE";
};

const SAVED = "tanti.checkout";
const empty: Form = { name: "", phone: "", email: "", address: "", area: "", city: "Dhaka", zone: "DHAKA", note: "", paymentMethod: "COD" };

/* eslint-disable @next/next/no-img-element */
export function CheckoutForm() {
  const { cart, refresh } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<Form>(empty);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  // Bring back the details from the last order on this device.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring saved form values once.
      if (saved) setForm((f) => ({ ...f, ...JSON.parse(saved), note: "", paymentMethod: "COD" }));
    } catch {
      // Storage may be unavailable; the form simply starts empty.
    }
  }, []);

  useEffect(() => {
    if (!cart || cart.items.length === 0) return;
    let cancelled = false;
    request<Quote>("POST", "/checkout/quote", { zone: form.zone })
      .then((q) => !cancelled && setQuote(q))
      .catch(() => !cancelled && setQuote(null));
    return () => {
      cancelled = true;
    };
  }, [form.zone, cart]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  if (cart && cart.items.length === 0 && !placing) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center text-center">
        <div>
          <h1 className="font-display text-3xl font-light">Your bag is empty</h1>
          <Link href="/shop" className="mt-6 inline-block bg-ink px-8 py-3.5 text-sm font-medium text-paper">Continue shopping</Link>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    setFormError(null);
    setErrors({});
    try {
      const placed = await request<{ number: string; token: string; paymentUrl: string | null }>("POST", "/checkout", form);
      try {
        const { name, phone, email, address, area, city, zone } = form;
        localStorage.setItem(SAVED, JSON.stringify({ name, phone, email, address, area, city, zone }));
      } catch {
        // Not remembering details is fine.
      }
      if (placed.paymentUrl) {
        window.location.href = placed.paymentUrl;
        return;
      }
      router.replace(`/order/${placed.number}?t=${encodeURIComponent(placed.token)}`);
      void refresh();
    } catch (err) {
      setPlacing(false);
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setFormError(err.message);
        if (err.code.startsWith("checkout.") || err.code.startsWith("cart.")) void refresh();
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  };

  const fee = form.zone === "DHAKA" ? site.deliveryFees.insideDhaka : site.deliveryFees.outsideDhaka;

  return (
    <form onSubmit={submit} noValidate className="container-page grid gap-10 py-10 lg:grid-cols-12 lg:gap-16 md:py-14">
      <div className="space-y-12 lg:col-span-7">
        <Step n={1} title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.name} className="sm:col-span-2">
              <input autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Mobile number" hint="We'll call to confirm your order." error={errors.phone}>
              <input type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email (optional)" hint="For your receipt." error={errors.email}>
              <input type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
        </Step>

        <Step n={2} title="Delivery">
          <fieldset>
            <legend className="mb-3 text-sm font-medium">Where should we deliver?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["DHAKA", "Inside Dhaka", "1–2 days", site.deliveryFees.insideDhaka],
                ["OUTSIDE", "Outside Dhaka", "2–4 days", site.deliveryFees.outsideDhaka],
              ] as const).map(([value, label, time, price]) => (
                <label key={value} className={`flex cursor-pointer items-start gap-3 border p-4 transition ${form.zone === value ? "border-ink bg-white/70" : "border-line hover:border-ink/40"}`}>
                  <input type="radio" name="zone" value={value} checked={form.zone === value} onChange={() => set("zone", value)} className="mt-1 accent-ink" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-muted">{time}</span>
                  </span>
                  <span className="text-sm tabular-nums">{taka(price)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Address" hint="House, road, block or village" error={errors.address} className="sm:col-span-2">
              <input autoComplete="street-address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Area / thana" error={errors.area}>
              <input autoComplete="address-level3" value={form.area} onChange={(e) => set("area", e.target.value)} />
            </Field>
            <Field label="City / district" error={errors.city}>
              <input autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Note for the rider (optional)" error={errors.note} className="sm:col-span-2">
              <textarea rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="e.g. Call before coming, gate is on the left" />
            </Field>
          </div>
        </Step>

        <Step n={3} title="Payment">
          <div className="grid gap-3">
            <label className={`flex cursor-pointer items-center gap-4 border p-4 ${form.paymentMethod === "COD" ? "border-ink bg-white/70" : "border-line"}`}>
              <input type="radio" name="payment" checked={form.paymentMethod === "COD"} onChange={() => set("paymentMethod", "COD")} className="accent-ink" />
              <Banknote size={22} strokeWidth={1.4} className="text-clay" />
              <span className="flex-1">
                <span className="block text-sm font-medium">Cash on delivery</span>
                <span className="block text-xs text-muted">Pay the rider in cash when your parcel arrives.</span>
              </span>
            </label>
            <label className="flex cursor-not-allowed items-center gap-4 border border-line p-4 opacity-60">
              <input type="radio" name="payment" disabled className="accent-ink" />
              <CreditCard size={22} strokeWidth={1.4} />
              <span className="flex-1">
                <span className="block text-sm font-medium">Card, bKash or Nagad</span>
                <span className="block text-xs text-muted">Online payment is coming soon.</span>
              </span>
            </label>
          </div>
        </Step>
      </div>

      <aside className="lg:col-span-5">
        <div className="bg-sand/60 p-6 lg:sticky lg:top-8 md:p-8">
          <h2 className="eyebrow">Your order</h2>
          {!cart ? (
            <div className="mt-6 h-32 animate-pulse bg-sand" />
          ) : (
            <ul className="mt-5 space-y-4">
              {cart.items.map((line) => (
                <li key={line.variantId} className="flex gap-3">
                  <div className="relative w-16 shrink-0 bg-sand">
                    <div className="aspect-[3/4]">{line.image && <img src={line.image} alt="" className="h-full w-full object-cover" />}</div>
                    <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.625rem] font-semibold text-paper">{line.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium leading-snug">{line.name}</p>
                    <p className="text-xs text-muted">{line.color} · {line.size}</p>
                    {line.problem && <p className="text-xs text-sale">Not available in this quantity</p>}
                  </div>
                  <p className="text-sm tabular-nums">{taka(line.lineTotal)}</p>
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
            <Row label="Subtotal" value={quote ? taka(quote.subtotal) : "—"} />
            {quote && quote.discount > 0 && <Row label={`Discount (${quote.couponCode})`} value={`−${taka(quote.discount)}`} tone="ok" />}
            <Row label="Delivery" value={quote ? (quote.shippingFee === 0 ? "Free" : taka(quote.shippingFee)) : taka(fee)} />
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-medium tabular-nums">{quote ? taka(quote.total) : "—"}</span>
          </div>
          {formError && <p role="alert" className="mt-5 border-l-2 border-sale bg-sale/5 px-3 py-2 text-sm text-sale">{formError}</p>}
          <button
            type="submit"
            disabled={placing || !cart?.canCheckout}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-ink py-4 text-sm font-medium text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lock size={15} />
            {placing ? "Placing your order…" : `Place order${quote ? ` · ${taka(quote.total)}` : ""}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            By placing your order you agree to our <Link href="/pages/terms" className="underline">terms</Link>.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-6 flex items-center gap-3 font-display text-2xl font-light">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-ink font-sans text-sm">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      <span
        className={`block border bg-white/70 transition focus-within:border-ink [&>input]:w-full [&>input]:bg-transparent [&>input]:px-3.5 [&>input]:py-3 [&>input]:text-sm [&>input]:outline-none [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:bg-transparent [&>textarea]:px-3.5 [&>textarea]:py-3 [&>textarea]:text-sm [&>textarea]:outline-none ${
          error ? "border-sale" : "border-line"
        }`}
      >
        {children}
      </span>
      {error ? <span className="mt-1.5 block text-xs text-sale">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" }) {
  return (
    <div className={`flex justify-between ${tone === "ok" ? "text-ok" : ""}`}>
      <dt className={tone ? "" : "text-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
