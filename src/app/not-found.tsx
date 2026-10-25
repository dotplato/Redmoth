import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] flex-1 items-center overflow-hidden">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="container-page relative">
        <p className="eyebrow">Error 404</p>
        <h1 className="font-display mt-4 text-6xl leading-none sm:text-8xl">
          Off the <span className="mark">shelf.</span>
        </h1>
        <p className="mt-5 max-w-md text-lg leading-8 text-[var(--muted)]">
          This page doesn&rsquo;t exist. The listing may have been unpublished, or the link is mistyped.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tools" className="btn btn-primary btn-lg">
            Discover apps
          </Link>
          <Link href="/" className="btn btn-outline btn-lg">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
