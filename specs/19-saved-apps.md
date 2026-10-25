# 19 — Save Apps to a Collection

## Did
- **Schema:** migration `20261025100000_saved_tools` adds `SavedTool(creatorId, toolId, createdAt)` with a composite PK, an index on `(creatorId, createdAt)`, and cascade delete from both Creator and Tool. Saving uses the existing creator accounts (the site's only login).
- **API** `/api/saved`: `POST {toolId}` saves (idempotent upsert, published tools only) and `DELETE {toolId}` unsaves. Both return 401 when signed out.
- **`SavedProvider`** (client context, mounted in `(site)/layout.tsx`): the layout loads the signed-in account's saved ids server-side, and the provider is keyed by account id so login/logout resets it. `toggle()` is optimistic with rollback on failure and `router.refresh()` on success.
  - **Signed out:** a click stores the tool id in `sessionStorage` and goes to `/login?next=<current path+query>`. After login the provider sees the pending id, saves it and refreshes, so the visitor returns to the same page with the app saved.
- **`SaveButton`:**
  - **Card variant:** a bookmark in each `ToolCard`'s top-right, next to Featured. Hidden until card hover on desktop (`sm:opacity-0 sm:group-hover:opacity-100`), always visible on touch/narrow screens and when saved (yellow filled). It sits above the card's stretched link.
  - **Full variant:** "Save / Saved" next to Visit and Compare on the tool page.
- **Collection:** `/saved` ("Saved apps · N", newest first, empty state → catalog; signed-out visitors go to login). The header shows a bookmark link with the count for signed-in users, and the account page links to Saved apps.

## Solved
- Cleared `.next/dev/cache` before restarting (see spec 18) so new styles were served.

## Errors
- Saved lists hold published apps only; an app that's unpublished later disappears from `/saved` (its row is kept, and it reappears if republished).

## Achieves
Verified in Chrome:
- signed out, the card icon has opacity 0 → 1 on hover, labelled "Log in to save Northline"; a click → `/login?next=%2Ftools` → after login, back on `/tools` with Northline saved
- saving PulseQuery on its page → "Saved", header "Saved apps (2)"; `/saved` listed PulseQuery and Northline, and unsaving there → 1
- at 390px the icon is always visible and there's no overflow

The test account was deleted (its saved rows cascaded). `tsc` + `eslint` are clean.
