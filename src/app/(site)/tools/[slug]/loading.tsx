import { DetailSkeleton, LoadingStatus } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingStatus />
      <DetailSkeleton />
    </>
  );
}
