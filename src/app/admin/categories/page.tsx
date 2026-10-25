import { CategoryManager } from "@/components/admin/CategoryManager";
import { PageHeader } from "@/components/admin/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { tools: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <PageHeader title="Categories" description="Shelves that tools are grouped into on Discover." />
      <CategoryManager categories={categories} />
    </div>
  );
}
