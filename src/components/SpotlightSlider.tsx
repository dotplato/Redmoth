"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowButton } from "./ScreenshotRail";
import { PricingTag } from "./PricingTag";
import { ToolLogo } from "./ToolLogo";
import { VisitButton } from "./VisitButton";

export type SpotlightTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  host: string;
  pricing: string;
  category: { name: string };
  creator: { name: string; slug: string };
  screenshot: { imageUrl: string; alt: string } | null;
};

const INTERVAL = 4000;
// A drag must travel this far (px) to change slide; anything shorter snaps back.
const DRAG_THRESHOLD = 60;

export function SpotlightSlider({ tools }: { tools: SpotlightTool[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startX: number; startY: number; moved: boolean; id: number } | null>(null);
  const count = tools.length;
  const go = (next: number) => setIndex((next + count) % count);

  // Auto-advance unless hovered/focused, or the visitor prefers reduced motion.
  useEffect(() => {
    if (paused || dragging || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setIndex((current) => (current + 1) % count), INTERVAL);
    return () => clearTimeout(id);
  }, [index, paused, dragging, count]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (count < 2 || (event.pointerType === "mouse" && event.button !== 0)) return;
    drag.current = { startX: event.clientX, startY: event.clientY, moved: false, id: event.pointerId };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved) {
      // Only take over once the gesture is clearly horizontal; vertical moves stay page scrolls.
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
      state.moved = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    // Resist at the ends so the first/last slide feels anchored.
    const atEdge = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
    setDragX(atEdge ? dx / 3 : dx);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    if (state.moved) {
      const dx = event.clientX - state.startX;
      if (dx <= -DRAG_THRESHOLD && index < count - 1) go(index + 1);
      else if (dx >= DRAG_THRESHOLD && index > 0) go(index - 1);
    }
    setDragX(0);
    setDragging(false);
    // Keep `moved` until the click that follows pointerup has been swallowed.
    setTimeout(() => (drag.current = null), 0);
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="This week's picks"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(index + 1);
        if (event.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div
        className={`card touch-pan-y overflow-hidden select-none ${count > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          // A drag that ends over a link or button must not also activate it.
          if (drag.current?.moved) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <div
          className={`flex ${dragging ? "" : "transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"}`}
          style={{ transform: `translateX(calc(-${index * 100}% + ${dragX}px))` }}
        >
          {tools.map((tool, i) => (
            <article
              key={tool.id}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${tool.name}`}
              aria-hidden={i !== index}
              inert={i !== index}
              className="grid w-full shrink-0 lg:grid-cols-[0.85fr_1.15fr]"
            >
              <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-4">
                  <ToolLogo src={tool.logoUrl} name={tool.name} size="lg" />
                  <div>
                    <p className="eyebrow">{tool.category.name}</p>
                    <h3 className="mt-1 text-4xl leading-none">{tool.name}</h3>
                  </div>
                </div>
                <p className="mt-6 text-lg leading-7 text-[var(--ink-soft)]">{tool.tagline}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{tool.description}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                  <span>
                    Made by{" "}
                    <Link
                      href={`/creators/${tool.creator.slug}`}
                      className="font-bold text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--ink)]"
                    >
                      {tool.creator.name}
                    </Link>
                  </span>
                  <PricingTag pricing={tool.pricing} />
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-3 lg:mt-auto lg:pt-8">
                  <VisitButton slug={tool.slug} label={`Visit ${tool.host}`} variant="accent" />
                  <Link href={`/tools/${tool.slug}`} className="btn btn-outline">
                    Read more
                  </Link>
                </div>
              </div>
              <Link
                href={`/tools/${tool.slug}`}
                tabIndex={-1}
                aria-hidden
                className="grid place-items-center border-t border-[var(--line)] bg-[var(--bg-deep)] p-4 sm:p-6 lg:border-l lg:border-t-0"
              >
                {tool.screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tool.screenshot.imageUrl}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                    draggable={false}
                    className="aspect-[16/10] w-full rounded-[1rem] border border-[var(--line)] bg-[var(--surface)] object-cover shadow-[var(--shadow)]"
                  />
                ) : (
                  <span className="grid aspect-[16/10] w-full place-items-center rounded-[1rem] border border-dashed border-[var(--line-strong)] text-sm text-[var(--faint)]">
                    Screenshots coming soon
                  </span>
                )}
              </Link>
            </article>
          ))}
        </div>
      </div>

      {count > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {tools.map((tool, i) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${tool.name}`}
                aria-current={i === index}
                className="relative h-2 overflow-hidden rounded-full bg-[var(--line-strong)] transition-all"
                style={{ width: i === index ? 40 : 8 }}
              >
                {/* Progress fill doubles as the autoplay timer. */}
                {i === index ? (
                  <span
                    key={`${index}-${paused || dragging}`}
                    className="absolute inset-y-0 left-0 rounded-full bg-[var(--ink)]"
                    style={{
                      width: paused || dragging ? "100%" : undefined,
                      animation: paused || dragging ? undefined : `spotlight-progress ${INTERVAL}ms linear forwards`,
                    }}
                  />
                ) : null}
              </button>
            ))}
            <span className="ml-2 text-xs font-bold text-[var(--faint)]">
              {index + 1} / {count}
            </span>
          </div>
          <div className="flex gap-2">
            <ArrowButton direction="prev" onClick={() => go(index - 1)} />
            <ArrowButton direction="next" onClick={() => go(index + 1)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
