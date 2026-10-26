import { FilterLink } from "./FilterNav";

/** Pill row of filter links (Price, Sort) on Discover. Must sit inside a FilterNavProvider. */
export function Segmented({
  label,
  param,
  options,
  current,
  href,
}: {
  label: string;
  /** The query param these options set (e.g. "pricing"). */
  param: string;
  options: readonly { value: string | undefined; label: string; color?: string }[];
  current: string | undefined;
  href: (value: string | undefined) => string;
}) {
  return (
    <div className="flex min-w-0 max-w-full items-center gap-2">
      <span className="shrink-0 text-xs font-bold text-[var(--faint)]">{label}</span>
      <nav
        aria-label={label}
        className="no-scrollbar flex min-w-0 overflow-x-auto rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-0.5"
      >
        {options.map((option) => {
          return (
            <FilterLink
              key={option.label}
              href={href(option.value)}
              active={option.value === current}
              param={param}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold text-[var(--muted)] transition hover:text-[var(--ink)] aria-[current=page]:bg-[var(--ink)] aria-[current=page]:text-white"
            >
              {option.color ? <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: option.color }} /> : null}
              {option.label}
            </FilterLink>
          );
        })}
      </nav>
    </div>
  );
}
