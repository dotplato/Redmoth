import { prisma } from "./prisma";

type EmailInput = { to: string; subject: string; text: string; toolId?: string };
export type EmailResult = { status: "SENT" | "SKIPPED" | "FAILED"; error?: string };

/**
 * Sends a plain-text email through Resend (https://resend.com) when RESEND_API_KEY and EMAIL_FROM are set.
 * Every attempt is stored in EmailLog, so nothing is lost while no provider is configured ("SKIPPED").
 */
export async function sendEmail({ to, subject, text, toolId }: EmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  let result: EmailResult;

  if (!apiKey || !from) {
    result = { status: "SKIPPED", error: "No email provider configured (set RESEND_API_KEY and EMAIL_FROM)" };
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, text }),
        signal: AbortSignal.timeout(15_000),
      });
      result = res.ok ? { status: "SENT" } : { status: "FAILED", error: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
    } catch (err) {
      result = { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  await prisma.emailLog.create({ data: { to, subject, body: text, status: result.status, error: result.error, toolId } });
  if (result.status !== "SENT") console.warn(`[email] ${result.status} → ${to}: ${subject}${result.error ? ` (${result.error})` : ""}`);
  return result;
}
