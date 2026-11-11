import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { first, type SearchParams } from "@/lib/listing";
import { OrderDetails, StatusTimeline } from "@/components/order/OrderDetails";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

type Props = { params: Promise<{ number: string }>; searchParams: Promise<SearchParams> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const token = first((await searchParams).t);
  if (!token) notFound();
  const order = await api.order(number, token);
  const firstName = order.name.split(" ")[0];
  return (
    <div className="container-page max-w-5xl py-12 md:py-20">
      <div className="animate-fade-up text-center">
        <CheckCircle2 size={44} strokeWidth={1.2} className="mx-auto text-ok" />
        <p className="eyebrow mt-6 text-clay">Order {order.number}</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight md:text-6xl">Thank you, {firstName}.</h1>
        <p className="mx-auto mt-4 max-w-lg text-ink-soft">
          We&rsquo;ve received your order and will call <strong className="font-medium text-ink">{order.phone}</strong> shortly to confirm it.
          Keep your order number to track it any time.
        </p>
      </div>
      <div className="mt-12 border border-line bg-white/50 p-6 md:p-10">
        <StatusTimeline order={order} />
      </div>
      <div className="mt-12">
        <OrderDetails order={order} />
      </div>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="bg-ink px-8 py-3.5 text-sm font-medium text-paper hover:bg-clay">Continue shopping</Link>
        <Link href={`/track?number=${order.number}`} className="border border-ink px-8 py-3.5 text-sm font-medium hover:bg-ink hover:text-paper">Track this order</Link>
      </div>
    </div>
  );
}
