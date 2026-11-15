import type { OrderView } from "@/lib/types";

const styles: Record<OrderView["status"], { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", className: "bg-sand text-ink-soft" },
  PLACED: { label: "Placed", className: "bg-clay/10 text-clay" },
  CONFIRMED: { label: "Confirmed", className: "bg-sand text-ink" },
  SHIPPED: { label: "On the way", className: "bg-ink text-paper" },
  DELIVERED: { label: "Delivered", className: "bg-ok/10 text-ok" },
  CANCELLED: { label: "Cancelled", className: "bg-sale/5 text-sale" },
};

export function StatusPill({ status }: { status: OrderView["status"] }) {
  const s = styles[status];
  return <span className={`inline-flex rounded-full px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] ${s.className}`}>{s.label}</span>;
}
