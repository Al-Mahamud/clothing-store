import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pages } from "@/config/pages";
import { sizeCharts } from "@/config/sizeCharts";
import { api } from "@/lib/api";
import { taka } from "@/lib/money";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/pages/${page.slug}` } };
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  if (!page) notFound();
  const fees = slug === "delivery-returns" ? await api.delivery().catch(() => null) : null;
  return (
    <div className="container-page grid gap-12 pb-8 pt-10 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-16 md:pt-16">
      <nav aria-label="Help and information" className="order-2 md:order-1">
        <p className="eyebrow mb-4 text-muted">Help</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 md:sticky md:top-28 md:flex-col md:gap-0 md:border-l md:border-t-0 md:pt-0">
          {pages.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/pages/${p.slug}`}
                aria-current={p.slug === slug ? "page" : undefined}
                className={`block text-sm transition md:-ml-px md:border-l-2 md:py-2 md:pl-4 ${p.slug === slug ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
              >
                {p.title}
              </Link>
            </li>
          ))}
          <li><Link href="/track" className="block border-transparent text-sm text-muted hover:text-ink md:-ml-px md:border-l-2 md:py-2 md:pl-4">Track your order</Link></li>
        </ul>
      </nav>
      <article className="order-1 max-w-2xl md:order-2">
        <h1 className="font-display text-5xl font-light leading-[1.02] tracking-tight md:text-6xl">{page.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">{page.intro}</p>
        {fees && (
          <section className="mt-10 grid border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-line" aria-label="Delivery fees">
            {[
              ["Inside Dhaka", taka(fees.insideDhaka), "1–2 days, our riders"],
              ["Outside Dhaka", taka(fees.outsideDhaka), "2–4 days, by courier"],
              ["Free delivery", `over ${taka(fees.freeOver)}`, "after discounts"],
            ].map(([label, value, note]) => (
              <div key={label} className="py-5 sm:px-5 sm:first:pl-0">
                <p className="eyebrow text-muted">{label}</p>
                <p className="mt-2 font-display text-3xl font-light">{value}</p>
                <p className="mt-1 text-xs text-muted">{note}</p>
              </div>
            ))}
          </section>
        )}
        {page.sections.map((s) => (
          <section key={s.heading} className="mt-12">
            <h2 className="font-display text-2xl font-light md:text-3xl">{s.heading}</h2>
            {s.body.map((para, i) => <p key={i} className="mt-3 leading-relaxed text-ink-soft">{para}</p>)}
          </section>
        ))}
        {slug === "size-guide" && Object.entries(sizeCharts).map(([key, chart]) => (
          <section key={key} className="mt-12" aria-labelledby={`chart-${key}`}>
            <h2 id={`chart-${key}`} className="font-display text-2xl font-light md:text-3xl">{chart.title}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-ink">{chart.columns.map((c) => <th key={c} scope="col" className="py-3 pr-4 font-medium">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {chart.rows.map((row) => (
                    <tr key={row[0]} className="border-b border-line">
                      {row.map((cell, i) => (i === 0 ? <th key={i} scope="row" className="py-3 pr-4 font-medium">{cell}</th> : <td key={i} className="py-3 pr-4 text-ink-soft">{cell}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">Inches unless marked. {chart.tip}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
