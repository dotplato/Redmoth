# 17 — Admin & AI Panel Multi-Screenshot Upload

## Did
- **`ScreenshotPicker` made reusable:** new props `max` (default 6), `allowSvg` (admin only), `compact` (2-column for side panels) and `id`, so it can appear twice on one page.
- **AI data entry panel:** the native multi-file input (which replaced its selection on every pick) is now the picker (`id="ai-screenshots"`, SVG allowed, compact). Applying the AI result merges its screenshots into the form's pending list, within the per-tool limit.
- **Admin tool editor sidebar:**
  - Saved screenshots come first (hover ✕ to delete), then the picker for new ones, limited to `6 − saved`. The header shows "N/6 saved".
  - **New tool:** picked screenshots upload after "Create tool".
  - **Edit:** an **"Upload N now"** button uploads immediately (Save also uploads anything pending). Failed uploads stay in the list with an error.
  - When a tool already has 6, the picker is replaced by a note.
- **Server limits:** `POST /api/admin/tools/[id]/screenshots` rejects uploads once a tool has 6. `DELETE /api/admin/screenshots/[id]` now also deletes the image file. Before, it only removed the DB row and left orphaned files; the path is checked to stay inside `public/uploads`.

## Solved
- **Regression found while testing:** when the "Submitted via the public form" banner was moved to the top of the editor (spec 12 follow-up), the move cut at the wrong `) : null}`. That nested the **Basics and Content sections inside the banner's condition**, so they only rendered for publicly submitted listings; every other tool's editor was missing name, slug, tagline, website, logo, description and body. Fixed by closing the banner before Basics. No data was affected: the controlled values were still sent unchanged on save.
- The two screenshots uploaded to Forgekit during testing were deleted in the UI. Their files predated the delete-file fix, so they were removed from disk after confirming no DB row referenced them.

## Errors
- Admin uploads still use the existing route's plain file write (any type, including SVG), as before; only the count is enforced. Public uploads remain raster-only.

## Achieves
Verified in Chrome as admin:
- the new-tool sidebar picker accumulated 2 + 1 → 3/6, and the AI panel picker 1 + 2 → 3/6
- Forgekit (3 saved) offered 0/3, "Upload 2 now" → 5/6 saved with the picker at 0/1, and deleting both restored 3/6
- after the regression fix, both the edit and new pages render Basics → Content → Example scenario → Pricing & affiliate → Classification

`tsc` + `eslint` are clean.
