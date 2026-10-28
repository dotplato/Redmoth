import Link from "next/link";
import { getCreatorSession } from "@/lib/creator-auth";
import { BurstLink } from "./BurstLink";
import { MobileMenu } from "./MobileMenu";
import { SiteLogo, SiteSymbol } from "./SiteLogo";

// `prefetch` on the main links loads those pages in full (data included) in the background as soon as the
// links are on screen, so opening them is instant. Any router.refresh() (after saves and edits) throws the
// preloaded copies away and the links fetch fresh ones. /saved is safe because saving always refreshes.
export async function SiteHeader({ savedCount = 0 }: { savedCount?: number }) {
  const session = await getCreatorSession();
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color:rgb(247_247_244_/_0.85)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" prefetch className="flex shrink-0 items-center" aria-label="redmoth home">
          {/* The full wordmark doesn't fit beside the mobile actions under 360px; the moth does. */}
          <SiteSymbol className="h-9 min-[360px]:hidden" alt="" />
          <SiteLogo className="hidden h-6 min-[360px]:block min-[390px]:h-7" alt="" />
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/discover" prefetch className="btn btn-ghost hidden md:inline-flex">
            Discover
          </Link>
          <Link href="/tools" prefetch className="btn btn-ghost hidden md:inline-flex">
            Tools
          </Link>
          <Link href="/flows" prefetch className="btn btn-ghost hidden md:inline-flex">
            Flows
          </Link>
          <Link href="/discover" prefetch aria-label="Discover" title="Discover" className="btn btn-ghost w-9 px-0 md:hidden">
            <CompassIcon />
          </Link>
          {session ? (
            <>
              <Link href="/saved" prefetch aria-label={`Saved (${savedCount})`} title="Saved apps and flows" className="btn btn-ghost hidden px-3 md:inline-flex">
                <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                  <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.6a.3.3 0 0 1-.48.24L8 10.9l-4.02 2.94a.3.3 0 0 1-.48-.24V3a.5.5 0 0 1 .5-.5Z" />
                </svg>
                {savedCount ? <span className="text-xs">{savedCount}</span> : null}
              </Link>
              <Link href="/account" className="btn btn-ghost hidden md:inline-flex">
                Account
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn btn-ghost hidden md:inline-flex">
              Creator login
            </Link>
          )}
          <Link href="/flows/new" className="btn btn-outline hidden md:inline-flex">
            <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Create Flow
          </Link>
          <BurstLink href="/submit">
            Submit an app
          </BurstLink>
          <MobileMenu signedIn={Boolean(session)} savedCount={savedCount} />
        </nav>
      </div>
    </header>
  );
}

function CompassIcon() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7.25" />
      <path d="M11.9 6.1 10.2 10.2 6.1 11.9 7.8 7.8Z" />
    </svg>
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
