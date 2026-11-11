import type { Metadata } from "next";
import { TrackForm } from "@/components/order/TrackForm";
import { first, type SearchParams } from "@/lib/listing";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const number = first((await searchParams).number) ?? "";
  return (
    <div className="container-page max-w-5xl py-12 md:py-20">
      <p className="eyebrow text-clay">Order status</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight md:text-5xl">Track your order</h1>
      <p className="mt-3 max-w-lg text-sm text-ink-soft">Enter your order number (it starts with TN) and the mobile number you ordered with.</p>
      <TrackForm initialNumber={number} />
    </div>
  );
}
