# 21 — Submission Review, Notifications, Email, Hero Curation

## Did
- **Schema** (migration `20261026100000_review_notifications_hero`; backup `prisma/dev.db.bak-before-review`):
  - `ToolStatus` gains **`REJECTED`**, and `Tool` gains `reviewNote` and `reviewedAt`.
  - New models **`HeroSlot`** (position 0–13 → toolId, unique, cascade), **`AdminNotification`** (type, title, body, toolId, read, createdAt) and **`EmailLog`** (to, subject, body, status SENT/SKIPPED/FAILED, error, toolId).
- **Notifications:** every public submission creates a `SUBMISSION` notification. The admin sidebar has **Notifications** with an unread badge (also on the mobile pill bar). `/admin/notifications` lists them with the app logo, status, Review/Open link and Mark read/unread, plus "Mark all read" (`PATCH /api/admin/notifications`).
- **Review:** submitted apps show a **ReviewPanel** at the top of the admin edit page (it replaces the old "Submitted" banner): submitter and dates, the last feedback sent, a feedback textarea, and **Publish** / **Reject**. `POST /api/admin/tools/[id]/review`:
  - publish → PUBLISHED; reject → REJECTED, with feedback (10+ chars) required to reject
  - saves `reviewNote`/`reviewedAt`, marks the app's notifications read, and emails the submitter (approval with link + optional note, or rejection with the feedback and a resubmit link)
  - the panel reports the email outcome
  - creators see "Not approved" / "Published" with the feedback on `/account`
- **Email** (`src/lib/email.ts`): sends through **Resend** (`RESEND_API_KEY` + `EMAIL_FROM`, plain fetch, no new dependency). Every attempt is logged to `EmailLog`. With no provider configured, emails are marked **SKIPPED** and shown in the **Email outbox** on the notifications page with the full message, so nothing is lost.
- **Hero curation:** slot positions moved to `src/lib/hero-slots.ts`, shared by the animation and the editor. `/admin/hero` (sidebar "Hero") has a clickable **slot map** that mirrors the scene, plus 14 rows each with an app select (published apps; picking one already placed moves it) and Remove, then **Save hero** and **Reset to automatic**. `PUT /api/admin/hero` replaces all slots and validates published-only and no duplicates.
  - **Home behaviour:** if any slots are curated, only those apps show (unpublished ones drop out) and the rest are "Your app here". If none are curated, it's automatic (logos first). `AppNetwork` now takes a positional `(app | null)[]`.

## Solved
- Removing the old banner: the first cut stopped at the inner `) : null}` (the same trap that caused the spec 17 regression), so it now cuts at the banner's own closing line, and the sections were re-verified (Basics → Classification intact).
- Moving the slots out of `AppNetwork`: the cut stopped at the `];` inside the type annotation; fixed.
- The hero editor's Automatic/Curated label now updates immediately after saving (local state) instead of waiting for the refresh.

## Errors
- **No email provider is configured**, so emails are saved to the outbox but not delivered. Add `RESEND_API_KEY` and `EMAIL_FROM` (a sender on a domain verified in Resend) to `.env` to deliver them.

## Achieves
Verified end to end in Chrome:
- 2 submissions → sidebar badge 2, "2 unread"
- Publish (with a note) → "Published. Email saved to the outbox"; Reject without feedback blocked; with feedback → "Rejected…"; notifications → "You're all caught up"; the outbox lists both emails
- the creator sees Published + note and Not approved + feedback
- hero: slot 1 = the new app, slot 2 = Northline, rest empty → home shows exactly those 2 + 12 placeholders; Reset → automatic again

Test data was deleted. `tsc` + `eslint` are clean.

## Follow-up — creators can edit & resubmit apps that weren't approved
- **Did:**
  - **Account page:** apps with status REJECTED show an **"Edit & resubmit"** button → `/account/apps/[id]/edit`. Only the account that submitted the app can open it (otherwise 404), and only while it's REJECTED (otherwise → `/account`).
  - **Form:** the same `SubmitToolForm`, with a new optional `existing` prop. Every field is pre-filled (text, category, release date, 4 scenario steps, pricing, affiliate, maker name), and the listing score starts from the current values. A red banner shows the admin's feedback. The logo is optional (empty keeps the current one). Current screenshots are listed with ✕ to remove, and the picker limit is `6 − kept`. The button reads "Resubmit for review", and success says "… is back in review".
  - **API** `PATCH /api/submit/[id]`: auth + ownership + REJECTED-only checks; the same validation as new submissions; drops removed screenshots (rows and files), adds new ones after the kept ones, updates all fields, sets status → DRAFT, `submittedAt` → now, `reviewedAt` → null (`reviewNote` is kept so the admin sees what was asked for), and creates a **"Resubmitted: X"** admin notification.
  - **Refactor:** submission validation, upload saving, field mapping and `resolveMaker` moved to `src/lib/submission.ts`, shared by `POST /api/submit` and the new PATCH.
- **Solved:** two failed test runs were test-script problems (a one-off browser stall, and "Log in" matching the header link first), not app bugs. The edit page was verified responsive.
- **Verified in Chrome:** submit with 2 screenshots → admin rejects with feedback → account shows "Not approved" + "Edit & resubmit" → the edit form had everything pre-filled (FREE_TRIAL, 2 kept screenshots, feedback banner, score 66) → new tagline, remove screenshot 2 (picker 0/5), add 1 → "back in review"; the account shows "In review", the edit URL now redirects, the admin sees "Resubmitted: …", and the DB has DRAFT, the new tagline, 2 screenshots, `reviewedAt` null. Test data was deleted. `tsc` + `eslint` are clean.

## Follow-up — listing score in admin notifications and the tools table
- **Did:**
  - `scoreTool(tool)` in `src/lib/listing-score.ts` maps a saved Tool (with `_count.screenshots`) onto the same `scoreListing()` the submit form uses, so the admin sees exactly the score the creator saw.
  - New `ScoreBadge` in `ScoreMeter.tsx`: a mini bar plus the number, using the meter's colours (red <40, amber 40–69, black 70–89, green 90+). Hovering it shows the level and the top things to improve; screen readers get "/ 100 listing score, level".
  - **Tools table** (`/admin/tools`): a new **Score** column after Status (table min width 640 → 720px).
  - **Notifications** (`/admin/notifications`): every entry linked to an app shows a "Listing score" badge before the status. It's computed live, so a resubmission shows the updated score.
- **Solved:** the first test script used the wrong admin URL (it was missing `/admin`) and found nothing; fixed the script. It wasn't an app bug.
- **Verified in Chrome (1366px):** the headers read Tool · Status · Score · Category · Creator · Shots. All 10 apps are scored (e.g. dribbble 77 Strong, Pinterest 69, Orbitmail 58) with tooltips like "Good start · To improve: Example scenario, Details, Affiliate program, Release date". No horizontal overflow. The notifications page shows the score on its app entries. `tsc` + `eslint` are clean.

## Follow-up — hero editor: slot map + pick-an-app dialog
- **Did:**
  - `/admin/hero` now has only the **slot map** (the 14-row select list is gone) plus the side card (Automatic/Curated, spots filled, Reset to automatic, View home page).
  - Clicking a spot opens a native `<dialog>` titled "Slot N · ring". It shows the app in that spot now (with **Remove**), a **search bar** (autofocused; matches name and tagline across all published apps), and, with no search, the **8 most recently added** apps (the page now orders apps by `createdAt desc` and includes the tagline).
  - Picking an app **saves right away** and closes the dialog ("Northline is now in slot 3."). An app already in another spot shows "Slot X · move" and moves when picked; the current one shows "Here".
  - Empty spots show "+" on hover, and the dialog closes on ✕, Esc or a backdrop click.
- **Note:** removing the last curated app leaves no curated slots, so the hero goes back to automatic, as before.
- **Verified in Chrome:**
  - No selects are left. Slot 3 opens a dialog with 8 recent apps.
  - "north" → only Northline. Picking it → "Northline is now in slot 3." and the map tile updated.
  - Reopening shows "In this spot now" with Remove, which works. Reset restored automatic mode (the state before the test).
  - At 390px the dialog fits with no overflow.
  - `tsc` + `eslint` are clean.
