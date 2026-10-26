"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PendingSubmitButton } from "../PendingSubmitButton";
import { SiteLogo } from "../SiteLogo";

const items = [
  { href: "/admin", label: "Overview", icon: "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" },
  { href: "/admin/tools", label: "Tools", icon: "M2.5 4.5h11M2.5 8h11M2.5 11.5h7" },
  { href: "/admin/flows", label: "Flows", icon: "M3.5 3.5h3v3h-3zM9.5 9.5h3v3h-3zM6.5 5h2.5a1.5 1.5 0 0 1 1.5 1.5v3" },
  { href: "/admin/creators", label: "Creators", icon: "M8 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 13.5c.6-2.3 2.6-3.5 5-3.5s4.4 1.2 5 3.5" },
  { href: "/admin/categories", label: "Categories", icon: "M2.5 2.5h5v5h-5zM8.5 8.5h5v5h-5zM11 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.5 11a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z" },
  { href: "/admin/analytics", label: "Analytics", icon: "M2.5 13.5h11M4.5 11V7M8 11V3.5M11.5 11V8.5" },
  { href: "/admin/hero", label: "Hero", icon: "M8 2.5 13.5 5.5 8 8.5 2.5 5.5Z M2.5 8.5 8 11.5 13.5 8.5 M2.5 11.5 8 14.5 13.5 11.5" },
  { href: "/admin/notifications", label: "Notifications", icon: "M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1H3l1-1Z M6.5 14h3" },
];

export function AdminNav({ email, unread = 0 }: { email: string; unread?: number }) {
  // The admin host rewrites "/tools" to "/admin/tools", so either form can be the current URL.
  const raw = usePathname();
  const pathname = raw.startsWith("/admin") ? raw : `/admin${raw === "/" ? "" : raw}`;
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] px-3 py-5 lg:flex">
        <Brand />
        <nav className="mt-8 grid gap-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-[var(--muted)] transition hover:bg-[var(--bg-deep)] hover:text-[var(--ink)] aria-[current=page]:bg-[var(--bg-deep)] aria-[current=page]:font-bold aria-[current=page]:text-[var(--ink)] aria-[current=page]:shadow-[inset_3px_0_0_var(--accent)]"
            >
              <Icon d={item.icon} />
              {item.label}
              {item.href === "/admin/notifications" && unread ? (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-bold text-[var(--accent-ink)]">
                  {unread}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <Link href="/admin/tools/new" className="btn btn-accent mt-6 w-full">
          + New tool
        </Link>
        <div className="mt-auto border-t border-[var(--line)] pt-4">
          <p className="truncate px-3 text-xs text-[var(--faint)]">{email}</p>
          <form action="/api/admin/logout" method="post">
            <PendingSubmitButton
              pendingLabel="Signing out…"
              className="mt-1 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-[var(--muted)] hover:bg-[var(--bg-deep)] hover:text-[var(--ink)]"
            >
              Sign out
            </PendingSubmitButton>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)] lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          <form action="/api/admin/logout" method="post">
            <PendingSubmitButton pendingLabel="Signing out…" className="btn btn-ghost btn-sm">
              Sign out
            </PendingSubmitButton>
          </form>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] text-[var(--muted)] aria-[current=page]:bg-[var(--accent)] aria-[current=page]:font-bold aria-[current=page]:text-[var(--accent-ink)]"
            >
              {item.label}
              {item.href === "/admin/notifications" && unread ? (
                <span className="ml-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--ink)] px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-2">
      <SiteLogo className="h-6" />
      <span className="text-sm text-[var(--faint)]">Admin</span>
    </Link>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d={d} />
    </svg>
  );
}
