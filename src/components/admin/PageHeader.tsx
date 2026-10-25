import Link from "next/link";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      {back ? (
        <Link href={back.href} className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← {back.label}
        </Link>
      ) : null}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl leading-none sm:text-[2.75rem]">{title}</h1>
          {description ? <div className="mt-2 text-sm text-[var(--muted)]">{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REJECTED" }) {
  const label = { DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived", REJECTED: "Rejected" }[status];
  return <span className={`badge badge-${status.toLowerCase()}`}>{label}</span>;
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-12 text-center text-sm text-[var(--muted)]">{children}</div>;
}
