import { LoadingStatus, Skeleton } from "@/components/Skeleton";

// Admin pages render inside the admin layout, so the sidebar stays while the page loads.
export default function Loading() {
  return (
    <div>
      <LoadingStatus />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-10 w-64" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-80 w-full rounded-2xl" />
    </div>
  );
}
