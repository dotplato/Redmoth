"use client";

import { useEffect, useState } from "react";

/** Sticky jump-links for the Discover sections; highlights the one in view. */
export function DiscoverNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    let frame = 0;
    // Current = the last section whose top has passed just under the sticky header and this bar.
    const sync = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = sections[0]?.id;
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) current = id;
      }
      setActive(atBottom ? sections[sections.length - 1]?.id : current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  return (
    <nav aria-label="Discover sections" className="sticky top-16 z-20 border-b border-[var(--line)] bg-[color:rgb(247_247_244_/_0.9)] backdrop-blur-xl">
      <div className="container-page no-scrollbar flex gap-1 overflow-x-auto py-2.5">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? "true" : undefined}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--ink)] aria-[current=true]:bg-[var(--ink)] aria-[current=true]:text-white"
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
