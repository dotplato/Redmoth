import { SavedProvider } from "@/components/SavedProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCreatorSession } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getCreatorSession();
  const saved = session
    ? [
        ...(await prisma.savedTool.findMany({ where: { creatorId: session.sub }, select: { toolId: true } })).map((row) => row.toolId),
        ...(await prisma.savedFlow.findMany({ where: { creatorId: session.sub }, select: { flowId: true } })).map((row) => row.flowId),
      ]
    : [];

  return (
    // Keyed by account so logging in/out starts from that account's saved list.
    <SavedProvider key={session?.sub ?? "signed-out"} signedIn={Boolean(session)} initial={saved}>
      <SiteHeader savedCount={saved.length} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </SavedProvider>
  );
}
