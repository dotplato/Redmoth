import { createAuthClient } from "better-auth/react";
import { MIN_PASSWORD_LENGTH } from "./auth-limits";

// Same-origin client: works on both the site and the admin domain.
export const authClient = createAuthClient();

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  INVALID_EMAIL: "Enter a valid email.",
  PASSWORD_TOO_SHORT: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  PASSWORD_TOO_LONG: "That password is too long.",
  INVALID_TOKEN: "This link is invalid or has expired. Request a new one.",
};

/** A user-facing message for a Better Auth client error. */
export function authErrorMessage(error: { code?: string; status?: number; message?: string } | null | undefined) {
  if (error?.status === 429) return "Too many attempts. Wait a minute and try again.";
  return (error?.code && MESSAGES[error.code]) || "Something went wrong. Please try again.";
}
