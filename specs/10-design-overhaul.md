# 10 — Design Overhaul

## Did
Redesigned the public site and the admin around one editorial design system: a warm paper background (`#f6f4ef`), ink text, one orange accent (`#ff5a1f`), Instrument Serif for display type, Geist for UI text, and Geist Mono for small labels. Tokens and shared classes (`.btn-*`, `.card`, `.input`, `.field`, `.badge-*`, `.chip`, `.eyebrow`, `.container-page`) live in `globals.css`.
- **Public:** new header and footer; home hero with search, category chips, stats, and a fanned stack of real tool cards; spotlight card with a screenshot rail; 3-column catalog with sticky search, scrollable category chips, and an empty state; tool page with a big title, accent Visit button + domain, a serif lead paragraph, a sticky creator card, a "clean link" note, and related tools; creator page; 404. `ToolCard` is fully clickable through a stretched link, with Visit kept as a separate target. New `ToolLogo`, `SectionHead`, and `lib/format.ts` (`hostname`, `daysAgo`).
- **Admin:** sidebar shell with active states and a "New tool" button (`AdminNav`), which becomes a scrollable pill bar on mobile; shared `PageHeader`/`StatusBadge`; overview with stat cards and visit rate; tools table with logos, slugs, status badges, and screenshot counts; tool editor split into Basics/Content/Classification sections, with logo preview, field hints, field-level validation errors, a sticky status/save bar, and a screenshot grid with hover-remove; centered login card.
- **AI panel:** backdrop, Esc to close, `inert` when hidden, logo preview, spinner, styled result/error notices.

## Solved
- **Invisible buttons and links:** `a { color: inherit }` was unlayered CSS, which in Tailwind v4 beats every utility. Dark buttons such as "Browse catalog" and "New tool" showed no text, and accent links rendered black. All base rules now sit in `@layer base`.
- **Admin mobile overflow:** the admin nav overflowed and made the page scroll sideways. Replaced by a responsive sidebar / pill bar. Verified there's no horizontal overflow at 390px.
- **Closed AI panel:** its shadow showed along the right edge and its controls were still focusable. Fixed with `inert` and a shadow that only applies when open.
- **Cropped logos:** wordmark logos such as Invideo's were cut off. Logos now use `object-contain`.
- **Lint errors:** Creators/Categories were client pages calling `setState` in an effect. They're now server pages with `CreatorManager`/`CategoryManager` client components that call `router.refresh()`, with slug auto-generated from the name. Admin overview `Date.now` purity → `daysAgo()` helper. Login `window.location` → `router.replace`. Analytics now renders on the server with readable labels instead of `OUTBOUND_CLICK`/`DETAIL_VIEW`.
- **Silent deletes:** deleting a creator/category still used by tools threw a 500 and failed silently. The delete routes now return 409 with "Used by N tools…", and the UI shows it.
- `SectionHead` was first exported from a page file, which Next doesn't allow. Moved to `components/`.

## Errors
- No browser-automation dependency was added to the project. Screenshots were taken with `puppeteer-core` from a temp folder outside the repo, driving the installed Chrome. Windows `node.exe` can't reach WSL's `/tmp`.
- The admin "View live" link uses `PUBLIC_SITE_URL` (added to `.env`/`.env.example`, default `http://localhost:3000`).
- Dark mode isn't implemented; the palette is light-only.
- `/api/admin/analytics` is no longer used by the UI but is kept for API consumers.

## Achieves
A polished, consistent storefront that works on mobile, and an admin panel that's faster to scan and harder to misuse. `tsc` and `eslint src` pass with zero errors.
