import { cache } from "react";
import { getAuthSession } from "./auth";
import { prisma } from "./prisma";

// Creators sign in through Better Auth (src/lib/auth.ts); their profile is the Creator row linked to the user.

export type CreatorSession = { sub: string; slug: string };

/** The signed-in creator's profile row plus their account email, or null. Cached per request. */
export const getCurrentCreator = cache(async () => {
  const session = await getAuthSession();
  if (!session) return null;
  const creator = await prisma.creator.findUnique({ where: { userId: session.user.id } });
  return creator ? { ...creator, email: session.user.email } : null;
});

/** `sub` is the Creator id (not the user id): it's what saved items, reviews and flows reference. */
export async function getCreatorSession(): Promise<CreatorSession | null> {
  const creator = await getCurrentCreator();
  return creator ? { sub: creator.id, slug: creator.slug } : null;
}

/** Only same-site paths are allowed as post-login destinations (no "//evil.com" or absolute URLs). */
export function safeNext(next: string | string[] | undefined, fallback = "/account") {
  const value = Array.isArray(next) ? next[0] : next;
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}
