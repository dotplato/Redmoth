"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";
import { Spinner } from "./Spinner";

// In-page filters (category chips, price/sort pills, search) navigate to the same page with new query
// params, which shows no route loading UI. These pieces give instant feedback instead: the clicked filter
// turns active right away and the current results dim until the new ones arrive.

type FilterNav = { pending: string | null; begin: (href: string) => void };

const FilterNavContext = createContext<FilterNav>({ pending: null, begin: () => {} });

export function FilterNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const current = query ? `${pathname}?${query}` : pathname;
  // Pending only while we're still on the URL the navigation started from, so it clears itself on arrival.
  const [nav, setNav] = useState<{ href: string; from: string } | null>(null);
  const pending = nav && nav.from === current ? nav.href : null;

  const begin = (href: string) => {
    if (href !== current) setNav({ href, from: current });
  };

  return <FilterNavContext.Provider value={{ pending, begin }}>{children}</FilterNavContext.Provider>;
}

/** Value of one query param in an app-relative URL ("/tools?category=x"), or null. */
const paramOf = (url: string, param: string) => new URLSearchParams(url.split("?")[1] ?? "").get(param);

/**
 * A filter link: shows as current (aria-current) as soon as a filter change starts; keeps the scroll
 * position. `param` names the query param this link sets, so while another filter is loading, each
 * group still highlights its own value (the pending URL keeps the other params).
 */
export function FilterLink({
  href,
  active,
  param,
  className,
  children,
}: {
  href: string;
  active: boolean;
  param?: string;
  className?: string;
  children: ReactNode;
}) {
  const { pending, begin } = useContext(FilterNavContext);
  let current = active;
  if (pending) current = param ? paramOf(pending, param) === paramOf(href, param) : pending === href;
  return (
    <Link href={href} scroll={false} onNavigate={() => begin(href)} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}

/** Wraps the results; dims them (and marks them busy) while a filter change is loading. */
export function FilterResults({ children }: { children: ReactNode }) {
  const { pending } = useContext(FilterNavContext);
  return (
    <div aria-busy={pending ? true : undefined} className={`transition-opacity duration-200 ${pending ? "pointer-events-none opacity-45" : ""}`}>
      {pending ? (
        <p role="status" className="sr-only">
          Updating results…
        </p>
      ) : null}
      {children}
    </div>
  );
}

/**
 * GET search form that navigates client-side (keeping the other filters as hidden inputs), with the same
 * pending feedback as the filter links. Empty fields are left out of the URL.
 */
export function FilterSearchForm({
  action,
  className,
  buttonLabel,
  children,
}: {
  action: string;
  className?: string;
  buttonLabel: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { pending, begin } = useContext(FilterNavContext);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const searching = pending !== null && pending === submitted;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }
    const href = params.size ? `${action}?${params}` : action;
    setSubmitted(href);
    begin(href);
    router.push(href, { scroll: false });
  }

  return (
    <form action={action} onSubmit={onSubmit} className={className}>
      {children}
      <button className="btn btn-primary" aria-disabled={searching ? true : undefined}>
        {searching ? <Spinner /> : null}
        {searching ? "Searching…" : buttonLabel}
      </button>
    </form>
  );
}
