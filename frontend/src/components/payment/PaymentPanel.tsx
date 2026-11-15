"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Banknote, Loader2, ShieldCheck, Timer } from "lucide-react";
import { ApiError, request } from "@/lib/client";
import { taka } from "@/lib/money";
import type { OrderView } from "@/lib/types";

type Outcome = "success" | "fail" | "cancel" | undefined;

function useCountdown(until: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  if (!until) return null;
  return Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000));
}

/**
 * For an online order still waiting for its money: pay now (again), or switch to cash on delivery.
 * Coming back from a successful payment, it waits a few seconds for the gateway's confirmation.
 */
export function PaymentPanel({ order, token, outcome, onChanged }: { order: OrderView; token?: string; outcome?: Outcome; onChanged?: () => void }) {
  const router = useRouter();
  const left = useCountdown(order.paymentExpiresAt);
  const [busy, setBusy] = useState<"pay" | "cash" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState(0);
  const confirming = outcome === "success" && checks < 10;

  const reload = () => (onChanged ? onChanged() : router.refresh());

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => {
      setChecks((c) => c + 1);
      reload();
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll while confirming.
  }, [confirming, checks]);

  const pay = async () => {
    setBusy("pay");
    setError(null);
    try {
      const { paymentUrl } = await request<{ paymentUrl: string }>("POST", `/orders/${order.number}/pay`, { token });
      window.location.assign(paymentUrl);
    } catch (e) {
      setBusy(null);
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      if (e instanceof ApiError && e.code !== "payment.gateway") reload();
    }
  };

  const cash = async () => {
    setBusy("cash");
    setError(null);
    try {
      await request("POST", `/orders/${order.number}/cash-on-delivery`, { token });
      reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (confirming) {
    return (
      <div className="border border-line bg-white/50 p-8 text-center md:p-12" role="status">
        <Loader2 className="mx-auto animate-spin text-clay" size={34} strokeWidth={1.5} />
        <h1 className="mt-5 font-display text-4xl font-light">Confirming your payment…</h1>
        <p className="mt-2 text-sm text-muted">This usually takes a few seconds. Please don&rsquo;t pay again.</p>
      </div>
    );
  }

  const minutes = left === null ? null : Math.floor(left / 60);
  const seconds = left === null ? null : String(left % 60).padStart(2, "0");
  const notice =
    outcome === "fail" ? "Your payment didn't go through. No money was taken — try again, or pay the rider in cash."
    : outcome === "cancel" ? "You left the payment page before paying."
    : outcome === "success" ? "We haven't heard from the payment company yet. If money left your account, it will show here soon — please don't pay twice."
    : null;

  return (
    <div className="animate-fade-up border border-line bg-white/50 p-7 text-center md:p-12">
      <p className="eyebrow text-clay">Order {order.number}</p>
      <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-light leading-[1.05] md:text-6xl">Almost there — <em>pay {taka(order.total)}</em> to confirm.</h1>
      {left !== null && left > 0 && (
        <p className="mt-6 inline-flex items-center gap-2 bg-sand px-5 py-2.5 text-sm">
          <Timer size={17} strokeWidth={1.6} className="text-clay" /> Set aside for you <span className="font-medium tabular-nums">{minutes}:{seconds}</span>
        </p>
      )}
      {notice && <p className="mx-auto mt-5 flex max-w-xl gap-2 border-l-2 border-clay bg-sand/60 px-4 py-3 text-left text-sm"><AlertCircle size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-clay" /> {notice}</p>}
      {error && <p role="alert" className="mx-auto mt-4 max-w-xl border-l-2 border-sale bg-sale/5 px-4 py-3 text-left text-sm text-sale">{error}</p>}
      <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:justify-center">
        <button type="button" onClick={pay} disabled={busy !== null || left === 0} className="inline-flex items-center justify-center gap-2 bg-ink px-8 py-3.5 text-sm font-medium text-paper transition hover:bg-clay disabled:opacity-50">
          <ShieldCheck size={17} strokeWidth={1.7} /> {busy === "pay" ? "Opening payment…" : `Pay ${taka(order.total)} now`}
        </button>
        <button type="button" onClick={cash} disabled={busy !== null} className="inline-flex items-center justify-center gap-2 border border-ink px-8 py-3.5 text-sm font-medium transition hover:bg-ink hover:text-paper disabled:opacity-50">
          <Banknote size={17} strokeWidth={1.7} /> {busy === "cash" ? "Switching…" : "Pay cash on delivery instead"}
        </button>
      </div>
      <p className="mt-5 text-xs text-muted">bKash, Nagad, Rocket and cards through SSLCommerz. If time runs out, the order is cancelled and nothing is charged.</p>
    </div>
  );
}
