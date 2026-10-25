"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Shot = { id: string; imageUrl: string; alt: string };

export function ScreenshotRail({ shots }: { shots: Shot[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: shots.length <= 1 });

  // Track which slide is nearest the left edge, and whether we can scroll further either way.
  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const items = Array.from(rail.children) as HTMLElement[];
    const left = rail.scrollLeft;
    let nearest = 0;
    items.forEach((item, index) => {
      if (Math.abs(item.offsetLeft - rail.offsetLeft - left) < Math.abs(items[nearest].offsetLeft - rail.offsetLeft - left)) nearest = index;
    });
    const atEnd = left + rail.clientWidth >= rail.scrollWidth - 2;
    // The last slide can't reach the left edge, so treat "scrolled to the end" as showing it.
    setActive(atEnd ? items.length - 1 : nearest);
    setEdges({ start: left <= 2, end: atEnd });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  function goTo(index: number) {
    const rail = railRef.current;
    const item = rail?.children[Math.max(0, Math.min(index, shots.length - 1))] as HTMLElement | undefined;
    if (!rail || !item) return;
    rail.scrollTo({ left: item.offsetLeft - rail.offsetLeft, behavior: "smooth" });
  }

  if (shots.length === 0) {
    return (
      <div className="grid aspect-[16/7] place-items-center rounded-[1.25rem] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] text-sm text-[var(--faint)]">
        Screenshots coming soon
      </div>
    );
  }

  const single = shots.length === 1;

  return (
    <div
      className="group/rail relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Screenshots"
      tabIndex={single ? undefined : 0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") goTo(active + 1);
        if (event.key === "ArrowLeft") goTo(active - 1);
      }}
    >
      <div ref={railRef} className={single ? "" : "screenshot-rail"}>
        {shots.map((shot, index) => (
          <figure
            key={shot.id}
            aria-label={`${index + 1} of ${shots.length}`}
            className="overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.imageUrl}
              alt={shot.alt}
              loading={index === 0 ? "eager" : "lazy"}
              draggable={false}
              className={`w-full rounded-[0.9rem] bg-[var(--bg-deep)] object-cover ${single ? "aspect-[16/9]" : "aspect-[16/10]"}`}
            />
          </figure>
        ))}
      </div>

      {single ? null : (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" aria-label="Choose screenshot">
            {shots.map((shot, index) => (
              <button
                key={shot.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show screenshot ${index + 1}`}
                aria-current={active === index}
                className={`h-2 rounded-full transition-all ${
                  active === index ? "w-6 bg-[var(--ink)]" : "w-2 bg-[var(--line-strong)] hover:bg-[var(--muted)]"
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-bold text-[var(--faint)]">
              {active + 1} / {shots.length}
            </span>
          </div>
          <div className="flex gap-2">
            <ArrowButton direction="prev" disabled={edges.start} onClick={() => goTo(active - 1)} />
            <ArrowButton direction="next" disabled={edges.end} onClick={() => goTo(active + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ArrowButton({
  direction,
  disabled,
  onClick,
  className = "",
}: {
  direction: "prev" | "next";
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous" : "Next"}
      className={`grid h-10 w-10 place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)] transition hover:border-[var(--ink)] disabled:pointer-events-none disabled:opacity-35 ${className}`}
    >
      <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {direction === "prev" ? <path d="M10 3.5 5.5 8l4.5 4.5" /> : <path d="M6 3.5 10.5 8 6 12.5" />}
      </svg>
    </button>
  );
}
