"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, MessageSquare } from "lucide-react";
import { TRACKS, type Track } from "@/lib/tracks";

/**
 * Three tracks per view, paged.
 *
 * Free scrolling was the wrong shape: it left a card half-visible at the edge
 * and gave no sense of how many there were. Paging shows a complete set, moves
 * a whole screenful at a time, and the dots say how much is left.
 *
 * The page count is measured rather than assumed. Cards are one, two or three
 * across depending on width, so "six cards" is two pages on a laptop and six
 * on a phone — reading it off the DOM keeps the dots honest at every size
 * without hardcoding the breakpoints twice.
 */
function TrackCard({ track }: { track: Track }) {
  return (
    <div
      className="flex shrink-0 grow-0 snap-start flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5
                 basis-full sm:basis-[calc(50%-8px)] lg:basis-[calc(33.333%-10.67px)]"
    >
      <div className="flex items-center gap-4 text-xs text-[var(--text-faint)]">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {track.minutes} min
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="size-3.5" />
          {track.questions} questions
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold">{track.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
        {track.blurb}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {track.topics.map((topic) => (
          <li
            key={topic}
            className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-faint)]"
          >
            {topic}
          </li>
        ))}
      </ul>

      <Link
        href={`/mock/${track.slug}`}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
      >
        Start interview
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export function TrackCarousel() {
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el || el.clientWidth === 0) return;
    // Rounded because sub-pixel widths otherwise produce a phantom last page.
    setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth)));
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;

    // Cards reflow at the breakpoints, so the page count has to be recomputed
    // on resize rather than only on mount.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  function go(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  }

  function goTo(index: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  const atStart = page <= 0;
  const atEnd = page >= pages - 1;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Choose a domain</h2>

        <div className="flex items-center gap-3">
          <p className="text-sm text-[var(--text-faint)]">
            {pages > 1 ? `Page ${page + 1} of ${pages}` : `${TRACKS.length} tracks`}
          </p>

          {pages > 1 ? (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={atStart}
                aria-label="Previous tracks"
                className="grid size-9 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:hover:bg-[var(--surface)]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={atEnd}
                aria-label="More tracks"
                className="grid size-9 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:hover:bg-[var(--surface)]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/*
        scrollbar-width:none hides the bar without disabling the scroll, so
        swiping and trackpads still work and the arrows are an addition rather
        than the only way through.
      */}
      <div
        ref={scroller}
        onScroll={measure}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TRACKS.map((track) => (
          <TrackCard key={track.slug} track={track} />
        ))}
      </div>

      {pages > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === page ? "true" : undefined}
              className={[
                "h-1.5 rounded-full transition-all",
                i === page
                  ? "w-6 bg-[var(--brand-bright)]"
                  : "w-1.5 bg-[var(--border-strong)] hover:bg-[var(--text-faint)]",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
