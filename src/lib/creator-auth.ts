import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { slugify } from "./slug";

// Separate cookie and token "kind" from the admin session so neither can be used as the other.
const COOKIE = "tm_creator";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export type CreatorSession = { sub: string; slug: string };

export async function setCreatorCookie(session: CreatorSession) {
  const token = await new SignJWT({ ...session, kind: "creator" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCreatorCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCreatorSession(): Promise<CreatorSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "creator" || typeof payload.sub !== "string" || typeof payload.slug !== "string") {
      return null;
    }
    return { sub: payload.sub, slug: payload.slug };
  } catch {
    return null;
  }
}

/** The signed-in creator row, or null if signed out (or the account was deleted). */
export async function getCurrentCreator() {
  const session = await getCreatorSession();
  if (!session) return null;
  return prisma.creator.findUnique({ where: { id: session.sub } });
}

/** Only same-site paths are allowed as post-login destinations (no "//evil.com" or absolute URLs). */
export function safeNext(next: string | string[] | undefined, fallback = "/account") {
  const value = Array.isArray(next) ? next[0] : next;
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}

export async function uniqueSlug(name: string, taken: (slug: string) => Promise<boolean>) {
  const base = slugify(name) || "item";
  let slug = base;
  for (let n = 2; await taken(slug); n++) slug = `${base}-${n}`;
  return slug;
}
