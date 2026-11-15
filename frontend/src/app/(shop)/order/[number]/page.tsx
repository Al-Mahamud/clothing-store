import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { first, type SearchParams } from "@/lib/listing";
import { taka } from "@/lib/money";
import { OrderDetails, StatusTimeline } from "@/components/order/OrderDetails";
import { AccountNudge } from "@/components/account/AccountNudge";
import { PaymentPanel } from "@/components/payment/PaymentPanel";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const outcomes = ["success", "fail", "cancel"] as const;

type Props = { params: Promise<{ number: string }>; searchParams: Promise<SearchParams> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const query = await searchParams;
  const token = first(query.t);
  if (!token) notFound();
  const order = await api.order(number, token);
  const firstName = order.name.split(" ")[0];
  const payment = outcomes.find((o) => o === first(query.payment));
  const paid = order.paymentStatus === "PAID";
  const live = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";
  return (
    <div className="container-page max-w-5xl py-12 md:py-20">
      {order.status === "PENDING_PAYMENT" ? (
        <PaymentPanel order={order} token={token} outcome={payment} />
      ) : order.status === "CANCELLED" ? (
        <div className="animate-fade-up text-center">
          <XCircle size={44} strokeWidth={1.2} className="mx-auto text-sale" />
          <p className="eyebrow mt-6 text-muted">Order {order.number}</p>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tight md:text-6xl">This order was cancelled.</h1>
          <p className="mx-auto mt-4 max-w-lg text-ink-soft">
            {paid ? `We received ${taka(order.total)} after the order closed. We'll refund it to the same account — no need to do anything.`
              : "It wasn't paid in time, so nothing was charged and the pieces went back into stock."}
          </p>
        </div>
      ) : (
        <div className="animate-fade-up text-center">
          <CheckCircle2 size={44} strokeWidth={1.2} className="mx-auto text-ok" />
          <p className="eyebrow mt-6 text-clay">Order {order.number}</p>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tight md:text-6xl">Thank you, {firstName}.</h1>
          {paid && <p className="mt-5 inline-flex items-center gap-2 bg-ink px-5 py-2 text-sm text-paper">Paid {taka(order.total)} online</p>}
          <p className="mx-auto mt-4 max-w-lg text-ink-soft">
            We&rsquo;ve received your order and will call <strong className="font-medium text-ink">{order.phone}</strong> shortly to confirm it.
            Keep your order number to track it any time.
          </p>
        </div>
      )}
      {live && (
        <div className="mt-12 border border-line bg-white/50 p-6 md:p-10">
          <StatusTimeline order={order} />
        </div>
      )}
      <div className="mt-12">
        <OrderDetails order={order} />
        {order.status !== "PENDING_PAYMENT" && <AccountNudge />}
      </div>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href={order.status === "CANCELLED" ? "/cart" : "/shop"} className="bg-ink px-8 py-3.5 text-sm font-medium text-paper hover:bg-clay">{order.status === "CANCELLED" ? "Back to your bag" : "Continue shopping"}</Link>
        <Link href={`/track?number=${order.number}`} className="border border-ink px-8 py-3.5 text-sm font-medium hover:bg-ink hover:text-paper">Track this order</Link>
      </div>
    </div>
  );
}
