"use client";

import { useEffect, useRef, useState } from "react";
import { FlowCard, type FlowCardData } from "./FlowCard";
import { ArrowButton } from "./ScreenshotRail";

export type CarouselFlow = FlowCardData & { reason?: string | null; rank?: number };

/**
 * Horizontal, snap-scrolling row of flow cards: arrows, mouse drag, swipe on touch, and a progress bar.
 * Each card can carry a rank and a short reason ("Uses Notion, which you saved").
 */
export function FlowCarousel({ flows, label }: { flows: CarouselFlow[]; label: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false, progress: 0 });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2, progress: max > 0 ? el.scrollLeft / max : 1 });
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [flows.length]);

  function page(direction: 1 | -1) {
    const el = rail.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  const scrollable = !(edges.start && edges.end);

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="relative">
      <div
        ref={rail}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") page(1);
          if (event.key === "ArrowLeft") page(-1);
        }}
        // Mouse drag to scroll (touch already swipes natively).
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0 || !rail.current) return;
          drag.current = { x: event.clientX, left: rail.current.scrollLeft, moved: false };
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          const el = rail.current;
          if (!state || !el) return;
          const dx = event.clientX - state.x;
          if (!state.moved && Math.abs(dx) < 6) return;
          if (!state.moved) {
            state.moved = true;
            el.setPointerCapture(event.pointerId);
            el.style.scrollSnapType = "none";
          }
          el.scrollLeft = state.left - dx;
        }}
        onPointerUp={() => {
          const el = rail.current;
          if (el) el.style.scrollSnapType = "";
          setTimeout(() => (drag.current = null), 0);
        }}
        onClickCapture={(event) => {
          // A drag that ends over a card must not also open it.
          if (drag.current?.moved) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onDragStart={(event) => event.preventDefault()}
        className={`no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 pt-1 outline-none ${scrollable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        {flows.map((flow, i) => (
          <div
            key={flow.id}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${flows.length}: ${flow.title}`}
            className="flex w-[85%] shrink-0 snap-start flex-col sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
          >
            {flow.rank || flow.reason ? (
              <div className="mb-2 flex min-h-6 items-center gap-2 px-1 text-xs">
                {flow.rank ? (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[var(--ink)] px-1.5 font-bold text-[var(--accent)]">
                    {flow.rank}
                  </span>
                ) : null}
                {flow.reason ? <span className="truncate text-[var(--muted)]">{flow.reason}</span> : null}
              </div>
            ) : null}
            <div className="flex flex-1 [&>article]:flex-1">
              <FlowCard flow={flow} />
            </div>
          </div>
        ))}
      </div>

      {scrollable ? (
        <div className="mt-4 flex items-center gap-4">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden>
            <div
              className="h-full rounded-full bg-[var(--ink)] transition-[width] duration-200"
              style={{ width: `${Math.max(12, edges.progress * 100)}%` }}
            />
          </div>
          <div className="flex gap-2">
            <ArrowButton direction="prev" disabled={edges.start} onClick={() => page(-1)} />
            <ArrowButton direction="next" disabled={edges.end} onClick={() => page(1)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
