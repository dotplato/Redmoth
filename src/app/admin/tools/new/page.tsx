import { PageHeader } from "@/components/admin/PageHeader";
import { ToolForm } from "@/components/admin/ToolForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewToolPage() {
  const [creators, categories] = await Promise.all([
    prisma.creator.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader title="New tool" description="Saved as a draft until you publish it." back={{ href: "/admin/tools", label: "Tools" }} />
      <ToolForm creators={creators} categories={categories} />
    </div>
  );
}
