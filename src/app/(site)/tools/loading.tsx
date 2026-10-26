import { CardGridSkeleton, ListingHeaderSkeleton, LoadingStatus } from "@/components/Skeleton";

// Shown instantly while the tools listing renders on the server.
export default function Loading() {
  return (
    <div>
      <LoadingStatus label="Loading tools" />
      <ListingHeaderSkeleton />
      <section className="container-page py-10 pb-24">
        <CardGridSkeleton />
      </section>
    </div>
  );
}
