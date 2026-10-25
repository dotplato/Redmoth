# 15 — Tool Page Redesign, Animated Scenario Story, Compare

## Did
- **Header:** the logo sits on a yellow glow, with Featured / Free tier tags above a large name and the tagline. Visit sits next to a new **Compare** button that jumps to `#similar`. An "at a glance" row of 4 fact tiles shows Category (link), Pricing (yellow tile when there's a free tier), Released, and Made by (link).
- **Example scenario → `ScenarioStory`** (client), placed right under the header, full width, as a dark ink card:
  - **Graphics:** a persona avatar with pulsing yellow rings and "{Name}'s story" (the name is taken from the first capitalized word, ignoring words like "The"/"Our"), drifting yellow glows, and a dot grid.
  - **Timeline:** the story is split into sentences (only where the next one starts with a capital, so "order?” emails" stays whole). The steps are labelled Who & the problem → How it helps → The result, numbers/metrics are highlighted in yellow, and the spine draws downward as each step fades up in turn.
  - **Outcome:** a "Before → After" graph whose curve draws itself, with a dot riding it (requestAnimationFrame, since SMIL `begin` counts from page load). The last two metrics in the text pop in as big yellow stat chips, labelled Time saved / Cost / Improvement / Result.
  - **Behavior:** it plays once, when 25% visible (IntersectionObserver). Reduced-motion users get the finished state.
- **Body:** a left column with "Inside {name}" screenshots and an About card (description as heading + body). The right sidebar is sticky: **"More like this"** (`SimilarApps`) lists 5 apps (same category first, then others), each with a +/✓ compare toggle (max 3 + the current app), a "Compare N apps →" button, and a fixed bottom compare bar on mobile once something is ticked.
- **Bottom band:** the "Made by" card and "Always free to list" note moved here from the sidebar.
- **Compare page** (`/compare?apps=a,b,c`): up to 4 apps side by side.
  - Each column header has the logo, name, tagline, Visit, and ✕ to remove. Rows: Category, Pricing, Released, Made by, What it does, In practice (scenario), Screenshot.
  - "Add an app" is a select (GET → server redirect folds `add` into `apps`). There's an empty state, and the table scrolls sideways on mobile with a sticky label column.
  - The old "More in {category}" band was removed; the sidebar replaces it.

## Solved
- The sentence splitter broke "where's my order?” emails" into a fragment. It now splits only before a capitalized next sentence.
- The metric regex turned "$49/month" into "$49/mo" + "nth" (alternation order). Longer units are now listed first.
- Mobile overflowed horizontally: the page grid's implicit column grew to the screenshot rail's content. Fixed with `grid-cols-[minmax(0,1fr)]` on the page grid and the inner column.
- The dev server served stale CSS (no scenario rules), the same WSL→Windows watcher problem as before. Touching the file from Windows didn't help; restarting the dev server did.

## Errors
- Only Excalidraw currently has an example scenario. The seeded demo tools have none, so their pages skip the story section.

## Achieves
Verified in Chrome:
- the story plays in sequence (step 1 visible at 0.25s; graph, dot and chips finished by ~4.5s)
- compare: ticking 2 builds `/compare?apps=excalidraw,pulsequery,lumenboard`, Add makes 4 columns, ✕ removes one
- no horizontal overflow at 390px

`tsc` + `eslint` are clean.

## Revision — back to minimalist (admin feedback: "too flashy")
- **Did:** removed `ScenarioStory`. It guessed names and metrics from free text, which can't be trusted for arbitrary input, and its CSS went with it. Restored the previous tool-page header exactly (no fact tiles, no logo glow, no header Compare button). New layout: header → full-width screenshots → About (left) | right column with **`ScenarioCard`** + **More like this**. `ScenarioCard` shows the scenario verbatim in a quiet white card with a pinging yellow dot, a 1.5px yellow accent edge with a slow shimmer, and a one-time fade-up; reduced-motion disables both. Made by / Always free to list stay in the bottom band.
- **Compare made obvious:** "More like this" has a **Compare** button at the top of the section. Clicking it switches the list into selection mode: an explanation line ("Pick up to 3 apps to compare side by side with X"), real checkboxes, and **Compare N apps** at the bottom (disabled hint until one is picked), plus Cancel. Out of compare mode, rows are plain links. Removed the always-visible +/✓ buttons and the mobile floating bar.
- **Errors:** the dev server crashed with "memory allocation of 16777216 bytes failed" (the machine was briefly low on RAM), which made pages hang and logos look broken in screenshots. Restarted it. The test script now always closes its headless browser and uses a longer protocol timeout.
- **Verified:** Compare → 5 checkboxes; ticking 2 → "Compare 3 apps" → `/compare?apps=excalidraw,pulsequery,lumenboard` (3 columns). No overflow at 390px. `tsc` + `eslint` are clean.

## Follow-up — tag labels & styles
- **Did:** the "Free tier" tag text is now "Free" everywhere it's a label (cards, tool page, spotlight, floating cards, compare), the catalog price filter reads All / Free / Paid only, and the home stat is "Free apps". Form questions ("Is there a free tier?") keep their full wording. **Featured** now uses the old free-tier look (ink outline + yellow dot). **Free** uses the same outline shape in green (`--ok` border/text, `--ok-soft` fill, green dot). The admin "Submitted" marker previously borrowed these classes; it now has its own `.tag-submitted` (solid yellow) so it doesn't turn green or match Featured.
- **Verified in Chrome:** filter "All | Free | Paid only"; Free tags computed color rgb(29,122,73); Featured border rgb(11,11,11). `tsc` + `eslint` are clean. The dev server was restarted to pick up the CSS (WSL watcher issue).

## Follow-up — app card shows category instead of creator
- **Did:** `ToolCard` no longer shows "by {creator}". The category (eyebrow style) sits in the bottom-left next to Visit. The top-right category label was removed to avoid showing it twice, so only the Featured tag sits there now. `ToolCard` is shared, so the home grid, search results, related and creator pages match the catalog. The unused `creator` prop was dropped from `ToolCardData`.
- **Verified:** 7 cards on /tools, none containing "by …". `tsc` + `eslint` are clean.

## Follow-up — "N users visited" on app cards
- **Did:** every `ToolCard` (catalog, home grid, search, creator pages) shows a small people icon + "N users visited" next to the Free tag. It's compact-formatted (1.2K), with "1 user visited" singular and "Be the first to visit" at 0. The count is the number of `OUTBOUND_CLICK` events (Visit-button redirects through `/go/[slug]`), loaded via a shared `VISITS` `_count` include in `publishedTools`/`featuredTools`, AI search, and the creator page.
- **Errors/limits:** events aren't tied to a visitor, so the number is total visits, not unique people (a repeat click counts again). Unique counts would need an anonymous visitor cookie/id on `Event`.
- **Verified:** cards match the DB (Excalidraw 5, Northline 4, others 0 → "Be the first to visit"), and counts show on /tools, /, /search and /creators. `tsc` + `eslint` are clean.

## Follow-up — header Compare button
- **Did:** added a **Compare** outline button (swap-arrows icon) next to "Visit website" on the tool page header (`CompareJumpButton` in `SimilarApps.tsx`). Clicking it smooth-scrolls to "More like this" (`scroll-mt-24` keeps it clear of the sticky header) and fires a `toolsmade:start-compare` window event that switches the list into compare mode, so the checkboxes are already showing. Without JS it falls back to a plain `#similar` anchor.
- **Verified in Chrome:** a click scrolls from 0 → section top 96px below the viewport top, with 5 checkboxes visible. The buttons sit side by side on desktop and wrap cleanly on mobile, with no overflow at 390px. `tsc` + `eslint` are clean.
