import Link from "next/link";
import { getCreatorSession } from "@/lib/creator-auth";

export async function SiteHeader({ savedCount = 0 }: { savedCount?: number }) {
  const session = await getCreatorSession();
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color:rgb(247_247_244_/_0.85)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label="redmoth home">
          <BrandMark />
          <span className="hidden text-[15px] font-bold tracking-tight min-[400px]:inline">redmoth</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/discover" className="btn btn-ghost hidden md:inline-flex">
            Discover
          </Link>
          <Link href="/tools" className="btn btn-ghost hidden md:inline-flex">
            Tools
          </Link>
          <Link href="/flows" className="btn btn-ghost hidden md:inline-flex">
            Flows
          </Link>
          <Link href="/discover" aria-label="Discover" className="btn btn-ghost w-10 px-0 md:hidden">
            <SearchIcon />
          </Link>
          {session ? (
            <>
              <Link href="/saved" aria-label={`Saved (${savedCount})`} title="Saved apps and flows" className="btn btn-ghost px-3">
                <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                  <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.6a.3.3 0 0 1-.48.24L8 10.9l-4.02 2.94a.3.3 0 0 1-.48-.24V3a.5.5 0 0 1 .5-.5Z" />
                </svg>
                {savedCount ? <span className="text-xs">{savedCount}</span> : null}
              </Link>
              <Link href="/account" className="btn btn-ghost">
                Account
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn btn-ghost">
              <span className="sm:hidden">Log in</span>
              <span className="hidden sm:inline">Creator login</span>
            </Link>
          )}
          <Link href="/flows/new" aria-label="Create Flow" className="btn btn-outline px-3 sm:px-4">
            <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            <span className="hidden sm:inline">Create Flow</span>
          </Link>
          <Link href="/submit" className="btn btn-accent">
            <span className="sm:hidden">Submit</span>
            <span className="hidden sm:inline">Submit an app</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function BrandMark() {
  return (
    <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] bg-[var(--ink)]">
      <span className="font-display text-[19px] leading-none text-white">T</span>
      <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
    </span>
  );
}

export function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}
