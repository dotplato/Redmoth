import Link from "next/link";
import { EmptyRow, PageHeader, StatusBadge } from "@/components/admin/PageHeader";
import { MarkAllRead, ToggleRead } from "@/components/admin/NotificationActions";
import { ScoreBadge } from "@/components/forms/ScoreMeter";
import { ToolLogo } from "@/components/ToolLogo";
import { scoreTool } from "@/lib/listing-score";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const when = (date: Date) => date.toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function NotificationsPage() {
  const [notifications, emails] = await Promise.all([
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { tool: { include: { _count: { select: { screenshots: true } } } } },
    }),
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const unread = notifications.filter((n) => !n.read).length;
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up."}
        actions={<MarkAllRead disabled={!unread} />}
      />

      <div className="card overflow-hidden">
        {notifications.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {notifications.map((n) => {
              const score = n.tool ? scoreTool(n.tool) : null;
              return (
                <li key={n.id} className={`flex flex-wrap items-center gap-4 px-5 py-4 ${n.read ? "" : "bg-[var(--accent-soft)]/60"}`}>
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-[var(--line-strong)]" : "bg-[var(--accent)] ring-1 ring-[var(--ink)]"}`}
                  />
                  {n.tool ? <ToolLogo src={n.tool.logoUrl} name={n.tool.name} size="sm" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className={n.read ? "text-[var(--ink-soft)]" : "font-bold"}>{n.title}</p>
                    <p className="text-sm text-[var(--muted)]">{n.body}</p>
                    <p className="mt-0.5 text-xs text-[var(--faint)]">{when(n.createdAt)}</p>
                  </div>
                  {score ? (
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--faint)]">Listing score</span>
                      <ScoreBadge score={score.score} level={score.level} missing={score.nextSteps.map((step) => step.label)} />
                    </span>
                  ) : null}
                  {n.tool ? <StatusBadge status={n.tool.status} /> : null}
                  <ToggleRead id={n.id} read={n.read} />
                  {n.tool ? (
                    <Link href={`/admin/tools/${n.tool.id}`} className="btn btn-primary btn-sm">
                      {n.tool.status === "DRAFT" ? "Review" : "Open"}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyRow>No notifications yet. New public submissions will appear here.</EmptyRow>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Email outbox</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {emailConfigured
              ? "Emails are sent through Resend."
              : "No email provider configured — emails are saved here but not delivered. Add RESEND_API_KEY and EMAIL_FROM to .env to send them."}
          </p>
        </div>
      </div>
      <div className="card mt-4 overflow-hidden">
        {emails.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {emails.map((e) => (
              <li key={e.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`badge ${e.status === "SENT" ? "badge-published" : e.status === "FAILED" ? "badge-rejected" : "badge-draft"}`}
                  >
                    {e.status === "SKIPPED" ? "Not sent" : e.status === "SENT" ? "Sent" : "Failed"}
                  </span>
                  <p className="min-w-0 flex-1 truncate font-bold">{e.subject}</p>
                  <span className="text-xs text-[var(--faint)]">{when(e.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">To {e.to}</p>
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-[var(--ink-soft)]">Show message</summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-[var(--bg)] p-3 font-sans text-[13px] leading-6 text-[var(--ink-soft)]">
                    {e.body}
                  </pre>
                  {e.error ? <p className="mt-1 text-xs text-[var(--danger)]">{e.error}</p> : null}
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>No emails yet.</EmptyRow>
        )}
      </div>
    </div>
  );
}
