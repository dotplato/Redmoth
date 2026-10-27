import { SavedProvider } from "@/components/SavedProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCreatorSession, getSessionUserId } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  // The saved lists filter through the user id, so they load alongside the creator row, not after it.
  const [session, savedTools, savedFlows] = userId
    ? await Promise.all([
        getCreatorSession(),
        prisma.savedTool.findMany({ where: { creator: { userId } }, select: { toolId: true } }),
        prisma.savedFlow.findMany({ where: { creator: { userId } }, select: { flowId: true } }),
      ])
    : [null, [], []];
  const saved = session ? [...savedTools.map((row) => row.toolId), ...savedFlows.map((row) => row.flowId)] : [];

  return (
    // Keyed by account so logging in/out starts from that account's saved list.
    <SavedProvider key={session?.sub ?? "signed-out"} signedIn={Boolean(session)} initial={saved}>
      <SiteHeader savedCount={saved.length} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </SavedProvider>
  );
}
