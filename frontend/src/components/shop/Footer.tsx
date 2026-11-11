import Link from "next/link";
import { site } from "@/config/site";
import { NewsletterForm } from "./NewsletterForm";

const columns = [
  {
    title: "Shop",
    links: [
      ["Men", "/c/men"],
      ["Women", "/c/women"],
      ["Kids", "/c/kids"],
      ["New arrivals", "/shop?sort=newest"],
      ["Sale", "/shop?sale=true"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Track your order", "/track"],
      ["Delivery & returns", "/pages/delivery-returns"],
      ["Size guide", "/pages/size-guide"],
      ["FAQ", "/pages/faq"],
      ["Contact us", "/pages/contact"],
    ],
  },
  {
    title: "About",
    links: [
      ["Our story", "/pages/about"],
      ["Privacy", "/pages/privacy"],
      ["Terms", "/pages/terms"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p className="font-display text-3xl font-light leading-tight md:text-4xl">
            New drops, restocks and quiet sales — first.
          </p>
          <p className="mt-3 max-w-sm text-sm text-paper/60">One short email a fortnight. No spam, unsubscribe any time.</p>
          <NewsletterForm />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-6 md:col-start-7">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-5 text-paper/50">{col.title}</p>
              <ul className="space-y-3 text-sm">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-paper/85 hover:text-paper hover:underline underline-offset-4">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-page flex flex-col gap-4 py-8 text-xs text-paper/55 md:flex-row md:items-center md:justify-between">
          <p className="font-display text-lg uppercase tracking-[0.3em] text-paper">{site.name}</p>
          <p>{site.address} · {site.phone}</p>
          <div className="flex flex-wrap items-center gap-2">
            {["Cash on delivery", "bKash", "Nagad", "Visa", "Mastercard"].map((m) => (
              <span key={m} className="rounded border border-paper/15 px-2 py-1 text-[0.625rem] uppercase tracking-wider text-paper/70">
                {m}
              </span>
            ))}
          </div>
        </div>
        <p className="container-page pb-8 text-xs text-paper/40">© {new Date().getFullYear()} {site.name}. Made in Bangladesh.</p>
      </div>
    </footer>
  );
}
