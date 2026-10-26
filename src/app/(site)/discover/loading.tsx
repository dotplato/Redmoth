import { CardGridSkeleton, LoadingStatus, Skeleton } from "@/components/Skeleton";

// Discover: title, the sticky section bar, then the boards.
export default function Loading() {
  return (
    <div>
      <LoadingStatus label="Loading Discover" />
      <div className="container-page pb-8 pt-10">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-12 w-2/3 max-w-md" />
        <Skeleton className="mt-5 h-4 w-full max-w-xl" />
      </div>
      <div className="border-y border-[var(--line)]">
        <div className="container-page flex gap-2 py-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      </div>
      <div className="container-page grid gap-6 py-10 pb-24">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <CardGridSkeleton count={3} />
      </div>
    </div>
  );
}
