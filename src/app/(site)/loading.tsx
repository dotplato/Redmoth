import { LoadingStatus, PageSkeleton } from "@/components/Skeleton";

// Fallback for any site page without its own loading.tsx (home, forms, search…).
export default function Loading() {
  return (
    <>
      <LoadingStatus />
      <PageSkeleton />
    </>
  );
}
