import Link from "next/link";
import { Check } from "lucide-react";
import type { OrderView } from "@/lib/types";
import { taka } from "@/lib/money";

const steps = [
  { status: "PLACED", label: "Placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "SHIPPED", label: "On the way" },
  { status: "DELIVERED", label: "Delivered" },
] as const;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

export function StatusTimeline({ order }: { order: OrderView }) {
  if (order.status === "CANCELLED") {
    return <p className="border-l-2 border-sale bg-sale/5 px-4 py-3 text-sm text-sale">This order was cancelled.</p>;
  }
  if (order.status === "PENDING_PAYMENT") {
    return <p className="border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm">Waiting for your payment to complete.</p>;
  }
  const reached = steps.findIndex((s) => s.status === order.status);
  return (
    <ol className="grid grid-cols-4">
      {steps.map((step, i) => {
        const done = i <= reached;
        const event = order.events.find((e) => e.status === step.status);
        return (
          <li key={step.status} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-4 h-px w-full ${i <= reached ? "bg-ink" : "bg-line"}`} aria-hidden />}
            <span className={`relative grid h-8 w-8 place-items-center rounded-full border text-xs ${done ? "border-ink bg-ink text-paper" : "border-line bg-paper text-muted"}`}>
              {done ? <Check size={14} /> : i + 1}
            </span>
            <span className={`mt-2 text-xs font-medium ${done ? "" : "text-muted"}`}>{step.label}</span>
            {event && <span className="text-[0.6875rem] text-muted">{dateFormat.format(new Date(event.at))}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/* eslint-disable @next/next/no-img-element */
export function OrderDetails({ order }: { order: OrderView }) {
  return (
    <div className="grid gap-8 md:grid-cols-5">
      <div className="md:col-span-3">
        <h2 className="eyebrow mb-4">Items</h2>
        <ul className="divide-y divide-line border-y border-line">
          {order.items.map((item, i) => (
            <li key={i} className="flex gap-4 py-4">
              <Link href={`/p/${item.slug}`} className="w-16 shrink-0 bg-sand">
                <div className="aspect-[3/4]">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</div>
              </Link>
              <div className="flex-1 text-sm">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted">{item.color} · {item.size} · Qty {item.quantity}</p>
              </div>
              <p className="text-sm tabular-nums">{taka(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{taka(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount ({order.couponCode})</dt><dd className="tabular-nums">−{taka(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="tabular-nums">{order.shippingFee === 0 ? "Free" : taka(order.shippingFee)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-medium"><dt>Total</dt><dd className="tabular-nums">{taka(order.total)}</dd></div>
        </dl>
      </div>
      <div className="space-y-6 text-sm md:col-span-2">
        <div>
          <h2 className="eyebrow mb-3">Delivering to</h2>
          <p className="font-medium">{order.name}</p>
          <p className="text-ink-soft">{order.address}</p>
          <p className="text-ink-soft">{order.area}, {order.city}</p>
          <p className="text-ink-soft">{order.phone}</p>
          {order.note && <p className="mt-2 text-xs italic text-muted">“{order.note}”</p>}
        </div>
        <div>
          <h2 className="eyebrow mb-3">Payment</h2>
          <p>{order.paymentMethod === "COD" ? `Cash on delivery — please keep ${taka(order.total)} ready.` : order.paymentStatus === "PAID" ? "Paid online" : "Online payment pending"}</p>
        </div>
      </div>
    </div>
  );
}
