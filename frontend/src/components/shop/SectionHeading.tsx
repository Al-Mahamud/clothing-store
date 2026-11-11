import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        {eyebrow && <p className="eyebrow mb-3 text-clay">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-light tracking-tight md:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
