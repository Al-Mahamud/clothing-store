import Link from "next/link";
import { api } from "@/lib/api";
import { productQuery, type SearchParams } from "@/lib/listing";
import { FilterPanel, MobileFilters, SortSelect, ActiveFilters } from "./Filters";
import { LoadMoreGrid } from "./LoadMoreGrid";

type Crumb = { name: string; href: string };

/** The product grid page shared by /shop, categories, collections and search. */
export async function Listing({
  scope,
  searchParams,
  eyebrow,
  title,
  description,
  crumbs = [],
  tabs,
  banner,
}: {
  scope: Record<string, string>;
  searchParams: SearchParams;
  eyebrow?: string;
  title: string;
  description?: string | null;
  crumbs?: Crumb[];
  tabs?: { name: string; href: string; active: boolean }[];
  banner?: React.ReactNode;
}) {
  const query = productQuery(scope, searchParams);
  const page = await api.products(query);
  return (
    <div className="container-page">
      <nav aria-label="Breadcrumb" className="pt-6 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          {crumbs.map((c) => (
            <li key={c.href} className="flex items-center gap-2">
              <span aria-hidden>/</span>
              <Link href={c.href} className="hover:text-ink">{c.name}</Link>
            </li>
          ))}
        </ol>
      </nav>

      {banner}

      <header className="flex flex-col gap-4 pb-8 pt-8 md:flex-row md:items-end md:justify-between md:pt-12">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow mb-3 text-clay">{eyebrow}</p>}
          <h1 className="font-display text-4xl font-light tracking-tight md:text-6xl">{title}</h1>
          {description && <p className="mt-4 text-sm leading-relaxed text-ink-soft md:text-base">{description}</p>}
        </div>
      </header>

      {tabs && tabs.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                t.active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="sticky top-16 z-30 -mx-4 flex items-center justify-between gap-3 border-y border-line bg-paper/90 px-4 py-3 backdrop-blur md:top-[4.5rem] md:-mx-8 md:px-8 xl:-mx-12 xl:px-12">
        <div className="flex items-center gap-3">
          <MobileFilters facets={page.facets} total={page.total} />
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">{page.total}</span> {page.total === 1 ? "style" : "styles"}
          </p>
        </div>
        <SortSelect />
      </div>

      <div className="grid gap-10 pt-8 lg:grid-cols-[15rem_1fr] xl:gap-14">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-40">
            <FilterPanel facets={page.facets} />
          </div>
        </aside>
        <div>
          <ActiveFilters facets={page.facets} />
          {page.items.length === 0 ? (
            <div className="grid place-items-center border border-dashed border-line px-6 py-24 text-center">
              <p className="font-display text-2xl font-light">Nothing matches those filters</p>
              <p className="mt-2 text-sm text-muted">Try removing a size or colour, or widen the price range.</p>
            </div>
          ) : (
            <LoadMoreGrid key={query.toString()} initial={page} query={query.toString()} />
          )}
        </div>
      </div>
    </div>
  );
}
