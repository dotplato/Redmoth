import { CreatorManager } from "@/components/admin/CreatorManager";
import { PageHeader } from "@/components/admin/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage() {
  const creators = await prisma.creator.findMany({
    include: { _count: { select: { tools: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <PageHeader title="Creators" description="The people and studios behind each tool." />
      <CreatorManager creators={creators} />
    </div>
  );
}
