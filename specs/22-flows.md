# 22 — Flows (user-made workflows)

## Did
- **Schema** (migration `20261027100000_flows`; backup `prisma/dev.db.bak-before-flows`):
  - **`Flow`**: title, slug, summary, optional logoUrl, featured, `visits` counter, author (Creator, cascade), category.
  - **`FlowTool`** (the stack: flowId + toolId + position), **`FlowStep`** (toolId, position, title, description), **`SavedFlow`**.
  - Deleting an app removes it from stacks and steps (cascade).
- **Discover tabs:** `/tools` and the new `/flows` share `DiscoverTabs`: a "Tools N | Flows N" pill switch plus a secondary **+ Create Flow** button. The `/flows` page has search (title, description, or **an app in the stack**, e.g. "Northline"), category chips (only categories that have flows), and sort Featured / Newest / Most visited. `Segmented` moved to `src/components/Segmented.tsx` so both pages share it.
- **Create Flow** (`/flows/new`, login required → `/login?next=/flows/new`), `FlowForm`:
  1. **Build your stack:** search all published apps (name, tagline, category), or pick from the 12 most-visited. Click to add or remove; the stack shows numbered chips with ✕ (2–12 apps). Adding an app also starts a step for it.
  2. **Write the steps:** each step has an app (select limited to the stack), a title and a description, with ↑ / ↓ / ✕ and **+ Add step** (2–20 steps). Removing an app drops its empty steps; written steps stay and ask for another app.
  3. **Name your flow:** title, description, category, and an optional icon upload. With no icon, `FlowMark` shows a 2×2 mosaic of the stack's logos.
  - There's a sticky live **Preview** (icon, title, counts, stack, step titles). It **publishes immediately with no review** and redirects to the flow page with a "Your flow is live" banner.
- **Flow page** `/flows/[slug]`: icon, title, summary, by-author link, category, step and app counts, "N users visited", Featured tag, **Save**, and for the author **Edit** / **Delete**. A numbered step timeline links each step's app; apps that are no longer listed show "no longer listed". A sticky "The stack" card links to each app's page. There's a "Got a better way? + Create Flow" prompt and "More {category} flows" below. Visits count every view except the author's own.
- **Edit** `/flows/[slug]/edit` (author only, 404 otherwise), `PATCH /api/flows/[id]`: the stack and steps are replaced, and the icon can be kept, replaced or removed. **Delete** is `DELETE /api/flows/[id]`. Create is `POST /api/flows`. Validation is in `src/lib/flows.ts` (`readFlow`), with limits in `src/lib/flow-limits.ts`. Errors come back per field (`step-2-title` etc.) and show in place.
- **Cards:** `FlowCard` has the icon, Featured tag, hover Save, title, summary, a "N steps" pill, "N users visited", the category, and an overlapping stack-logo row (`StackRow`).
- **Saving:** `SavedProvider` / `SaveButton` take `kind: "tool" | "flow"`, and `/api/saved` accepts `{ flowId }`. The pending save after login is stored as JSON (old bare ids still work). `/saved` is now "Saved" with Apps and Flows sections, and the header count includes flows.
- **Account:** a "Your flows" card (category, steps, visits, Featured, Edit, View) with **+ Create Flow**. The creator's public profile lists their flows.
- **Admin:** `/admin/flows` (sidebar "Flows") lists every flow with author and email, category, steps, visits and saves, a **★ Feature** toggle (`PATCH /api/admin/flows/[id]`) and **Delete**.

## Solved
- At 390px the form and the flow page scrolled sideways: grid tracks default to `auto`, so `truncate` text forced min-content width. Fixed with `grid-cols-[minmax(0,1fr)]` on those grids and truncated stack chips.
- The dev server had to be stopped for the migration (Windows file lock). The first `taskkill` used a stale PID; it was re-run with the PID from `netstat`.

## Errors
- None outstanding. In the test, "v2" landed at the start of the edited title only because of where the test script typed it, not because of an app problem.

## Achieves
Verified in Chrome:
- `/tools` shows "Tools 8 | Flows 0" and Create Flow. Signed out → login with `next`; after sign-up you land on `/flows/new`.
- An empty publish shows all errors at once (stack, steps, title, description, category).
- Searching "north" → Northline added, plus 2 more → 3 auto-created steps. Removed step 3, added one, moved step 1 down (the order held through publishing) → published with the banner, steps in the right order, 3 stack apps.
- Save → `/saved` shows "Saved · 1 / Flows · 1". Edit was pre-filled and saved.
- An anonymous visit → "1 user visited". Admin featured it → the card shows Featured. Searching `/flows?q=Northline` finds it.
- Delete → `/account`. No overflow at 390px on `/flows`, `/flows/new` (with steps) and the flow page.

Test accounts and flows were deleted. `tsc` + `eslint` are clean.

## Follow-up — Create Flow in the header
- **Did:** the site header has a secondary **+ Create Flow** button (outline) just before the primary "Submit an app". On phones (<640px) it shrinks to a round "+" icon, still labelled "Create Flow" for screen readers. It links to `/flows/new`; signed-out visitors go through login and come back.
- **Verified in Chrome:** at 1440 and 768px it reads "+ Create Flow"; at 390 and 360px it's the "+" icon. No overflow, and the header stays 64px tall at every width.

## Follow-up — AI search finds flows; "Find tools and flows"; Tools and Flows in the nav
- **Did:**
  - **AI search** (`src/lib/ai-search.ts`) ranks apps **and** flows in a single OpenRouter call, so token use stays about the same.
    - The catalog lines use short ids: `A1…` for apps, `F1…` for flows. A flow line holds its title, summary, category, "uses <stack apps>" and its step titles.
    - The model returns `{"results":[{"id":"A3"|"F1","why"}]}`, up to 6 apps and 4 flows, and is told to prefer flows for multi-step needs.
    - Prefiltering: above 40 flows, they're keyword-prefiltered (apps are still prefiltered above 80).
    - Keyword fallback: `flowScore` weighs title > summary/category/stack app names > step titles. Ranking now uses a shared generic `rank()`.
    - The cache stores both lists.
  - **`/search`**: "Tools and flows for your need", a summary line like "3 apps and 1 flow for …", then a **Tools** section and a **Flows** section. `FlowCard` gained a `note` prop, so flows show "Why it fits:" like apps do. The loading and empty-state text mention flows.
  - **Button:** "Find apps" → **"Find tools and flows"** (it stays "Find" on phones, where the bar is narrow).
  - **Nav:** "Discover" was replaced by **Tools** (`/tools`) and **Flows** (`/flows`), since Discover was the same page as Tools. On phones the search icon still opens Discover.
- **Verified in Chrome:** created a test flow "Research to blog post" (Lumenboard → Northline). On the home page the nav reads Tools · Flows · Saved · Account · Create Flow · Submit an app, and the button reads "Find tools and flows". The query "I want to write a blog post backed by real research" returned "3 apps and 1 flow", **Ranked by AI**, with the flow's reason: "Guides you from cited sources to a finished blog post using Northline and Lumenboard." No overflow at 390px. The test flow and account were deleted. `tsc` + `eslint` are clean.

## Follow-up — AI search returned only the flow, no tools (cold emailing)
- **Problem:** "koi tool chahiye jo cold emailing me help kry" (Roman Urdu) returned only "Cold Emailer Workflow". Apps and flows shared one result list, and the prompt said "skip loosely related items", so a matching flow crowded out apps like Orbitmail (drafts emails). The keyword fallback also missed it: "emailing"/"emailen" never matched "email", and "email" never matched "Orbitmail".
- **Did** (`src/lib/ai-search.ts`):
  - **Prompt:** the output is now separate `{"apps":[…],"flows":[…]}` lists, and the model is told to judge them independently ("a matching flow never replaces matching apps"). It now:
    - understands any language, including Roman Urdu or Hindi, while writing reasons in English
    - includes an app when it handles a real part of the task (with a cold-email example)
    - refers to items by name, never by id
  - **Parsing:** ids carry their kind, so items filed under the wrong key (or an old-style `results` list) still work. Any stray `A3`/`F1` in a reason is replaced with the item's name (one reason had said "F1 chains drafting…").
  - **`ensureApps`:** if the model picks flows but no apps, it makes one **apps-only retry** (no flows in the prompt). If that's still empty, it shows the apps used by the matched flows ("Part of the “X” flow."). Keyword mode has the same flow-apps fallback.
  - **Keyword fallback:** crude stemming (words over 5 letters keep all but their last 3, minimum 5: emailing/emailen → "email") and small synonyms (email ↔ mail/inbox, photo ↔ image/shot).
- **Verified:**
  - AI: "koi tool chahiye jo cold emailing me help kry" → Northline, **Orbitmail** + Cold Emailer Workflow. "I need a tool for cold emailing" → the same. "mujhy koi tool chahye jo cold emailen bhj sky" → Northline + the flow (it had been flow only).
  - Non-email searches are unchanged: product photos → Stillframe; the research blog post → Lumenboard, Northline….
  - Keyword mode (AI off): the cold-email queries → **Orbitmail** first + the flow.
  - `tsc` + `eslint` are clean.
- **Note:** results also depend on what's listed. Right now Orbitmail is the only app that's really about email, so it's the main app match.

## Follow-up — "Top flows" on the home page
- **Did:** a new **Top flows** section on the home page, between the Spotlight ("This week's picks") and "Fresh on the shelf". It's a full-width band on `--bg-deep` with top/bottom borders, so it reads as its own block.
  - The heading has the eyebrow "Flows", the subline "Stacks of apps people use together, step by step.", and the actions **+ Create Flow** (ghost) and **View all N** (outline, links to `/flows`).
  - It shows up to 6 `FlowCard`s using `listFlows({ sort: "featured" })`: admin-featured flows first, then most visited, then newest.
  - With no flows, it shows a card "No flows yet." with **Create the first Flow**.
  - "Fresh on the shelf" got its own top padding now that it no longer follows the Spotlight directly.
- **Verified in Chrome:** the section order is This week's picks → Top flows → Fresh on the shelf, showing the 1 existing flow ("Cold Emailer Workflow") with + Create Flow and View all 1. No overflow at 1440 or 390px. `tsc` + `eslint` are clean.

## Follow-up — "View all" on the Spotlight
- **Did:** the home Spotlight heading ("This week's picks") has a **View all N** button (outline, small, same style as the other home sections), linking to `/tools` (all tools on Discover). N is the number of published tools.
- **Verified in Chrome:** at 1440 and 390px it reads "View all 8", with no overflow, and clicking it opens `/tools`. `tsc` is clean.
