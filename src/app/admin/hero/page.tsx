import { HeroEditor } from "@/components/admin/HeroEditor";
import { PageHeader } from "@/components/admin/PageHeader";
import { HERO_SLOT_COUNT } from "@/lib/hero-slots";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HeroPage() {
  const [apps, curated] = await Promise.all([
    prisma.tool.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, tagline: true, logoUrl: true } }),
    prisma.heroSlot.findMany(),
  ]);
  const live = new Set(apps.map((app) => app.id));
  const initial: (string | null)[] = Array(HERO_SLOT_COUNT).fill(null);
  for (const slot of curated) if (slot.position < HERO_SLOT_COUNT && live.has(slot.toolId)) initial[slot.position] = slot.toolId;

  return (
    <div>
      <PageHeader title="Hero animation" description="Choose which apps appear in the home page network, and where." />
      <HeroEditor apps={apps} initial={initial} curated={curated.length > 0} siteUrl={process.env.PUBLIC_SITE_URL ?? "http://localhost:3000"} />
    </div>
  );
}
