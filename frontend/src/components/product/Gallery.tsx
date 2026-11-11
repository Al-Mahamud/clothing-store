"use client";

import { useRef, useState } from "react";

/* eslint-disable @next/next/no-img-element */
/** Large images side by side on desktop; a swipeable strip with dots on phones. */
export function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    const el = strip.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  if (images.length === 0) {
    return <div className="aspect-[3/4] bg-sand" aria-label={`No image of ${name} yet`} />;
  }
  return (
    <div>
      <div
        ref={strip}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto md:mx-0 md:grid md:grid-cols-2 md:gap-2 md:overflow-visible"
      >
        {images.map((image, i) => (
          <div key={image.url} className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-sand animate-fade-up">
            <img
              src={image.url}
              alt={image.alt || name}
              loading={i < 2 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
          {images.map((image, i) => (
            <span key={image.url} className={`h-1 rounded-full transition-all ${i === index ? "w-6 bg-ink" : "w-2 bg-ink/25"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
