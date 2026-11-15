"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Camera, MessageSquareQuote, PenLine } from "lucide-react";
import type { Fit, MyReview, Review, ReviewForProduct, ReviewPage, ReviewSort, ReviewSummary } from "@/lib/types";
import { request } from "@/lib/client";
import { longDate } from "@/lib/format";
import { site } from "@/config/site";
import { useAccount } from "@/components/account/AccountProvider";
import { Modal } from "@/components/ui/Modal";
import { Stars } from "@/components/ui/Stars";
import { ReviewForm } from "./ReviewForm";

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: "RECENT", label: "Newest" },
  { value: "PHOTOS", label: "With photos" },
  { value: "HIGHEST", label: "Highest" },
  { value: "LOWEST", label: "Lowest" },
];

/** Reviews on a product page: summary, the shopper's own review, and the list (6 at a time). */
/* eslint-disable @next/next/no-img-element -- review photos are served by the backend as-is. */
export function Reviews({ slug, product, initial }: { slug: string; product: string; initial: ReviewPage }) {
  const { me } = useAccount();
  const [summary, setSummary] = useState(initial.summary);
  const [items, setItems] = useState(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<ReviewSort>("RECENT");
  const [loading, setLoading] = useState(false);
  const [mine, setMine] = useState<ReviewForProduct | null>(null);
  const [writing, setWriting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    let live = true;
    request<ReviewForProduct>("GET", `/account/reviews/for/${encodeURIComponent(slug)}`)
      .then((r) => live && setMine(r))
      .catch(() => live && setMine(null));
    return () => {
      live = false;
    };
  }, [me, slug]);

  const load = async (nextSort: ReviewSort, nextPage: number) => {
    setLoading(true);
    try {
      const r = await request<ReviewPage>("GET", `/products/${encodeURIComponent(slug)}/reviews?sort=${nextSort}&page=${nextPage}`);
      setSummary(r.summary);
      setTotal(r.total);
      setItems((old) => (nextPage === 0 ? r.items : [...old, ...r.items]));
      setPage(nextPage);
      setSort(nextSort);
    } finally {
      setLoading(false);
    }
  };

  const saved = (review: MyReview | null) => {
    setWriting(false);
    setMine({ canReview: true, review });
    void load(sort, 0);
  };

  const own = mine?.review ?? null;
  return (
    <section id="reviews" className="scroll-mt-24" aria-labelledby="reviews-heading">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow text-clay">From people who wear it</p>
          <h2 id="reviews-heading" className="mt-2 font-display text-4xl font-light md:text-5xl">Reviews</h2>
          {summary.count > 0 && summary.average !== null ? (
            <div className="mt-6">
              <div className="flex items-end gap-3">
                <span className="font-display text-6xl font-light leading-none">{summary.average.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars value={summary.average} size={18} />
                  <p className="mt-1 text-xs text-muted">{summary.count} {summary.count === 1 ? "review" : "reviews"}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-1.5" aria-label="Reviews by stars">
                {summary.stars.map((n, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-3 tabular-nums text-muted">{5 - i}</span>
                    <span className="h-1.5 flex-1 overflow-hidden bg-sand">
                      <span className="block h-full bg-ink" style={{ width: `${summary.count ? (n / summary.count) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 text-right tabular-nums text-muted">{n}</span>
                  </li>
                ))}
              </ul>
              <FitScale fit={summary.fit} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No reviews yet.</p>
          )}

          <div className="mt-8 border-t border-line pt-6 text-sm">
            {me === null ? (
              <>
                <p className="font-medium">Bought this?</p>
                <p className="mt-1 text-muted">Reviews come from customers whose order was delivered.</p>
                <Link href={`/login?next=${encodeURIComponent(`/p/${slug}#reviews`)}`} className="mt-3 inline-flex bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-clay">Sign in to review</Link>
              </>
            ) : mine?.canReview ? (
              <>
                <p className="font-medium">{own ? "Your review" : "You bought this one"}</p>
                {own ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Stars value={own.rating} />
                    {own.status === "HIDDEN" && <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[0.6875rem] font-medium text-clay">Hidden by the shop</span>}
                  </div>
                ) : (
                  <p className="mt-1 text-muted">Tell other shoppers how it fits, feels and washes.</p>
                )}
                <button type="button" onClick={() => setWriting(true)} className="mt-3 inline-flex items-center gap-2 bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-clay">
                  <PenLine size={15} /> {own ? "Edit your review" : "Write a review"}
                </button>
              </>
            ) : (
              <p className="text-muted">Reviews come from customers whose {product} was delivered. Every one is from a real order.</p>
            )}
          </div>
        </div>

        <div>
          {summary.count > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sort reviews">
              {SORTS.filter((s) => s.value !== "PHOTOS" || summary.withPhotos > 0).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={sort === s.value}
                  onClick={() => sort !== s.value && load(s.value, 0)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition ${sort === s.value ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                >
                  {s.value === "PHOTOS" && <Camera size={14} />}{s.label}
                </button>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <div className="mt-2 border border-dashed border-line p-10 text-center">
              <MessageSquareQuote size={28} className="mx-auto text-clay" strokeWidth={1.5} />
              <p className="mt-3 font-display text-2xl font-light">Be the first to review it</p>
              <p className="mt-1 text-sm text-muted">Bought the {product}? Tell others how it fits and feels.</p>
            </div>
          ) : (
            <ol className={`mt-6 divide-y divide-line border-y border-line transition ${loading && page === 0 ? "opacity-50" : ""}`}>
              {items.map((r) => <ReviewItem key={r.id} review={r} onPhoto={setPhoto} />)}
            </ol>
          )}

          {items.length < total && (
            <button type="button" disabled={loading} onClick={() => load(sort, page + 1)} className="mt-6 border border-ink px-8 py-3 text-sm font-medium transition hover:bg-ink hover:text-paper disabled:opacity-50">
              {loading ? "Loading…" : `Show more reviews (${total - items.length})`}
            </button>
          )}
        </div>
      </div>

      <Modal open={writing} onClose={() => setWriting(false)} title={own ? "Edit your review" : "Write a review"}>
        {writing && <ReviewForm slug={slug} product={product} existing={own} onDone={saved} />}
      </Modal>
      <Modal open={photo !== null} onClose={() => setPhoto(null)} title="Photo from a customer">
        {photo && <img src={photo} alt="Customer's photo" className="mx-auto max-h-[60vh] object-contain" />}
      </Modal>
    </section>
  );
}

export const fitWords: Record<Fit, string> = { SMALL: "Runs small", TRUE: "True to size", LARGE: "Runs large" };

/** "How it fits": the share of reviewers who said small, true to size or large, and a marker at the average. */
function FitScale({ fit }: { fit: ReviewSummary["fit"] }) {
  const total = fit.small + fit.trueToSize + fit.large;
  if (total === 0) return null;
  // -1 small … 0 true … +1 large
  const lean = (fit.large - fit.small) / total;
  const parts: [string, number][] = [["Runs small", fit.small], ["True to size", fit.trueToSize], ["Runs large", fit.large]];
  return (
    <div className="mt-7">
      <p className="eyebrow text-muted">How it fits</p>
      <div className="relative mt-3 grid grid-cols-3 gap-1" aria-hidden>
        {parts.map(([label]) => <span key={label} className="h-1.5 bg-sand" />)}
        <span className="absolute -top-1 h-3.5 w-1 -translate-x-1/2 bg-ink" style={{ left: `${50 + lean * 50 * (2 / 3)}%` }} />
      </div>
      <ul className="mt-2 grid grid-cols-3 text-[0.6875rem] text-muted" aria-label="How reviewers say it fits">
        {parts.map(([label, n], i) => (
          <li key={label} className={i === 1 ? "text-center" : i === 2 ? "text-right" : ""}>
            {label} <span className="tabular-nums">({n})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewItem({ review, onPhoto }: { review: Review; onPhoto: (url: string) => void }) {
  return (
    <li className="py-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} />
        {review.title && <h3 className="font-medium">{review.title}</h3>}
        {review.fit && <span className="rounded-full bg-sand px-2.5 py-0.5 text-[0.6875rem] text-ink-soft">{fitWords[review.fit]}</span>}
      </div>
      <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-soft">{review.body}</p>
      {review.photos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {review.photos.map((p) => (
            <button key={p.id} type="button" onClick={() => onPhoto(p.url)} className="overflow-hidden ring-offset-2 transition hover:ring-2 hover:ring-ink" aria-label="Open photo">
              <img src={p.url} alt="" loading="lazy" className="h-24 w-24 object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="font-medium text-ink">{review.author}</span>
        <span className="inline-flex items-center gap-1 text-ok"><BadgeCheck size={14} /> Verified buyer</span>
        {review.bought && <span>· {review.bought}</span>}
        <span>· {longDate(review.createdAt)}{review.edited ? " (edited)" : ""}</span>
      </p>
      {review.reply && (
        <div className="mt-4 border-l-2 border-clay bg-sand/60 px-4 py-3 text-sm">
          <p className="text-xs font-medium text-clay">Reply from {site.name}</p>
          <p className="mt-1 whitespace-pre-line text-ink-soft">{review.reply}</p>
        </div>
      )}
    </li>
  );
}
