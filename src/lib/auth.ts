import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { cache } from "react";
import { uniqueSlug } from "./slug";
import { MIN_PASSWORD_LENGTH } from "./auth-limits";
import { sendEmail } from "./email";
import { adminHost, isAdminHost } from "./host";
import { prisma } from "./prisma";
import { SITE_NAME, siteUrl } from "./seo";

export const ADMIN_ROLE = "admin";

const LINK_TTL_SECONDS = 60 * 60; // verification and reset links

const site = new URL(siteUrl());

/**
 * Emails a one-time link. The link is kept out of EmailLog (admins can read it there).
 * Locally, with no email provider configured, it's printed to the server log instead.
 */
async function sendLinkEmail(to: string, subject: string, intro: string, url: string) {
  const result = await sendEmail({
    to,
    subject,
    text: `${intro}\n\n${url}\n\nThis link expires in 1 hour. If you didn't ask for this, you can ignore this email.\n\n— ${SITE_NAME}`,
    logText: `${intro}\n\n[link removed]`,
  });
  if (result.status === "SKIPPED" && process.env.NODE_ENV !== "production") console.info(`[auth] ${subject} → ${to}: ${url}`);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.AUTH_SECRET,
  // The site and admin domains both serve /api/auth; email links use whichever domain the request came in on.
  baseURL: {
    allowedHosts: [site.host, adminHost()],
    fallback: site.origin,
    protocol: site.protocol === "https:" ? "https" : "http",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    resetPasswordTokenExpiresIn: LINK_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendLinkEmail(user.email, `Reset your ${SITE_NAME} password`, "Click the link below to choose a new password.", url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // Logging in unverified sends a fresh link, so there's no separate "resend" screen.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: LINK_TTL_SECONDS,
    sendVerificationEmail: async ({ user, url }) => {
      await sendLinkEmail(user.email, `Confirm your ${SITE_NAME} email`, "Click the link below to confirm your email and finish signing up.", url);
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  rateLimit: {
    // Database-backed so limits hold across Vercel's serverless instances.
    storage: "database",
  },
  databaseHooks: {
    user: {
      create: {
        // Every signup gets a creator profile (admins are created by script and skip this hook).
        after: async (user) => {
          const slug = await uniqueSlug(user.name, async (s) => Boolean(await prisma.creator.findUnique({ where: { slug: s } })));
          await prisma.creator.create({
            data: { name: user.name, slug, bio: `Independent maker on ${SITE_NAME}.`, userId: user.id },
          });
        },
      },
    },
    session: {
      create: {
        // Only admins may sign in on the admin domain.
        before: async (session, context) => {
          const host = context?.request?.headers.get("host") ?? context?.headers?.get("host") ?? null;
          if (!isAdminHost(host)) return;
          const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
          if (user?.role !== ADMIN_ROLE) throw new APIError("FORBIDDEN", { message: "This account can't sign in here." });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

/** The current Better Auth session (user + session), or null. Cached per request. */
export const getAuthSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export type AdminSession = { sub: string; email: string };

/** The signed-in admin, or null for anyone else (signed out, or a non-admin account). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getAuthSession();
  if (session?.user.role !== ADMIN_ROLE) return null;
  return { sub: session.user.id, email: session.user.email };
}
