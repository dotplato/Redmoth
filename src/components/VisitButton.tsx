import Link from "next/link";

export function VisitButton({
  slug,
  label = "Visit",
  variant = "primary",
  size = "md",
  className = "",
}: {
  slug: string;
  label?: string;
  variant?: "primary" | "accent" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = size === "md" ? "" : `btn-${size}`;
  return (
    <Link
      href={`/go/${slug}`}
      prefetch={false}
      // Outbound hop that may carry an affiliate link.
      rel="nofollow sponsored"
      className={`btn btn-${variant} ${sizeClass} group/visit ${className}`}
    >
      {label}
      <ArrowUpRight className="transition-transform group-hover/visit:-translate-y-0.5 group-hover/visit:translate-x-0.5" />
    </Link>
  );
}

export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
    >
      <path d="M4 10 10 4M5 4h5v5" />
    </svg>
  );
}
