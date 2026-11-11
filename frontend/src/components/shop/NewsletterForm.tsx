"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

/** Phase 7 stores subscribers; until then the form only confirms locally. */
export function NewsletterForm() {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <p className="mt-6 flex items-center gap-2 text-sm text-paper/80">
        <Check size={16} /> Thanks — you&rsquo;re on the list.
      </p>
    );
  }
  return (
    <form
      className="mt-6 flex max-w-md border-b border-paper/30 focus-within:border-paper"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="Your email address"
        className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-paper/40"
      />
      <button type="submit" className="flex items-center gap-2 py-3 pl-4 text-sm font-medium">
        Subscribe <ArrowRight size={16} />
      </button>
    </form>
  );
}
