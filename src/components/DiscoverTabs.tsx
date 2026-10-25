import Link from "next/link";

/** Tools | Flows switch at the top of Discover, with the Create Flow action beside it. */
export function DiscoverTabs({ current, tools, flows }: { current: "tools" | "flows"; tools: number; flows: number }) {
  const tabs = [
    { key: "tools", href: "/tools", label: "Tools", count: tools },
    { key: "flows", href: "/flows", label: "Flows", count: flows },
  ] as const;
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Discover" className="flex rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-1">
        {tabs.map((tab) => {
          const on = tab.key === current;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={on ? "page" : undefined}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition ${
                on ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
              <span className={`text-xs ${on ? "text-[var(--accent)]" : "text-[var(--faint)]"}`}>{tab.count}</span>
            </Link>
          );
        })}
      </nav>
      <Link href="/flows/new" className="btn btn-outline">
        <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8 3v10M3 8h10" />
        </svg>
        Create Flow
      </Link>
    </div>
  );
}
