import Link from "next/link";
import { BrandMark } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg-deep)]">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="text-[15px] font-bold tracking-tight">ToolsMade</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
            A hand-picked collection of independent AI products. Every Visit button opens the tool&rsquo;s own
            site. Some are affiliate links, which keep listings free.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="eyebrow">Browse</p>
            <ul className="mt-3 grid gap-2 text-[var(--ink-soft)]">
              <li>
                <Link href="/tools" className="hover:underline underline-offset-4">
                  All tools
                </Link>
              </li>
              <li>
                <Link href="/#featured" className="hover:underline underline-offset-4">
                  Featured
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Promise</p>
            <ul className="mt-3 grid gap-2 text-[var(--muted)]">
              <li>Free to list</li>
              <li>
                <Link href="/submit" className="hover:underline underline-offset-4">
                  Submit an app
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="container-page flex flex-col gap-1 py-5 text-xs text-[var(--faint)] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} ToolsMade</p>
          <p>Made for people who make with AI.</p>
        </div>
      </div>
    </footer>
  );
}
