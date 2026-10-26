// Placeholder shapes for loading states (route loading.tsx files and in-page fallbacks).

/** A pulsing block; size and shape come from className. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-[var(--bg-deep)] ${className}`} />;
}

/** Announces the loading state to screen readers once; the shapes themselves are hidden. */
export function LoadingStatus({ label = "Loading" }: { label?: string }) {
  return (
    <p role="status" className="sr-only">
      {label}…
    </p>
  );
}

/** Same footprint as ToolCard / FlowCard. */
export function CardSkeleton() {
  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-12 w-12 rounded-[14px]" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-1/3 rounded-full" />
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Header of a listing page (Tools / Flows): tabs, eyebrow, title, intro, search, chips, filters. */
export function ListingHeaderSkeleton() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="container-page pb-8 pt-8 sm:pt-10">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-11 w-52 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-12 w-3/4 max-w-md sm:h-14" />
        <Skeleton className="mt-5 h-4 w-full max-w-xl" />
        <Skeleton className="mt-2 h-4 w-2/3 max-w-sm" />
        <Skeleton className="mt-8 h-14 w-full max-w-2xl rounded-full" />
      </div>
      <div className="container-page">
        <div className="flex gap-2 pb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="flex justify-between gap-3 border-t border-[var(--line)] py-3">
          <Skeleton className="h-8 w-80 max-w-[60%] rounded-full" />
          <Skeleton className="h-8 w-48 max-w-[35%] rounded-full" />
        </div>
      </div>
    </section>
  );
}

/** Generic page: eyebrow, title, intro, then content blocks. Used where no closer match exists. */
export function PageSkeleton() {
  return (
    <div className="container-page py-12 pb-24">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-12 w-2/3 max-w-lg" />
      <Skeleton className="mt-5 h-4 w-full max-w-xl" />
      <Skeleton className="mt-2 h-4 w-1/2 max-w-sm" />
      <div className="mt-10">
        <CardGridSkeleton count={3} />
      </div>
    </div>
  );
}

/** Tool / flow detail: logo + title + actions, a wide media strip, then text and a side card. */
export function DetailSkeleton() {
  return (
    <div className="container-page py-10 pb-24">
      <Skeleton className="h-3 w-40" />
      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-[22px]" />
          <div>
            <Skeleton className="h-10 w-56 sm:w-72" />
            <Skeleton className="mt-3 h-4 w-64 sm:w-96" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </div>
      <div className="mt-10 flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="aspect-[16/10] w-[min(80vw,560px)] shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Profile: avatar + name + bio, then a grid of cards. */
export function ProfileSkeleton() {
  return (
    <div className="container-page py-12 pb-24">
      <div className="flex items-center gap-5">
        <Skeleton className="h-20 w-20 rounded-[22px]" />
        <div>
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-3 h-4 w-72 max-w-[60vw]" />
        </div>
      </div>
      <Skeleton className="mt-12 h-7 w-40" />
      <div className="mt-6">
        <CardGridSkeleton count={3} />
      </div>
    </div>
  );
}
