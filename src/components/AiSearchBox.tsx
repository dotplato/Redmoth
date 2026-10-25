import Link from "next/link";

export type CategoryChip = { id: string; name: string; slug: string; count: number };

/** Natural-language search box; submits to /search, where an LLM matches the request to listed apps and flows. */
export function AiSearchBox({
  defaultValue = "",
  categories,
  autoFocus = false,
  compact = false,
}: {
  defaultValue?: string;
  categories?: CategoryChip[];
  autoFocus?: boolean;
  /** Smaller box and chips, used in the home hero so the whole section fits one screen. */
  compact?: boolean;
}) {
  return (
    <div>
      <form
        action="/search"
        className={`group flex items-center gap-2 border border-[var(--line-strong)] bg-[var(--surface)] shadow-[var(--shadow)] ${compact ? "rounded-[1.25rem] p-1.5 pl-4" : "rounded-[1.5rem] p-2 pl-5"} transition focus-within:border-[var(--ink)] focus-within:shadow-[0_0_0_4px_var(--accent-soft),var(--shadow)]`}
      >
        <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-sm">
          ✦
        </span>
        <input
          name="q"
          required
          maxLength={300}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          aria-label="Describe what you need"
          placeholder="Describe what you need, it'll find for you"
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--faint)] ${compact ? "h-9 text-sm" : "h-11 text-[15px]"}`}
        />
        <button className={`btn btn-primary shrink-0 ${compact ? "h-9 px-4" : "h-11 px-5"}`}>
          <span className="hidden sm:inline">Find tools and flows</span>
          <span className="sm:hidden">Find</span>
        </button>
      </form>
      {categories?.length ? (
        <CategoryChips categories={categories} className={compact ? "mt-3" : "mt-4"} compact={compact} />
      ) : null}
    </div>
  );
}

export function CategoryChips({
  categories,
  className = "",
  compact = false,
}: {
  categories: CategoryChip[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <nav aria-label="Browse by category" className={`flex flex-wrap justify-center ${compact ? "gap-1.5" : "gap-2"} ${className}`}>
      <span className="self-center text-xs text-[var(--faint)]">Browse:</span>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/tools?category=${category.slug}`}
          className={`chip ${compact ? "!h-7 !px-2.5 !text-xs" : ""}`}
        >
          {category.name}
          <span className="chip-count">{category.count}</span>
        </Link>
      ))}
    </nav>
  );
}
