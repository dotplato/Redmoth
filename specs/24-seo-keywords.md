# 24 — SEO Keywords on App Forms

## Did
- **Schema:** `Tool.seoKeywords String?`, a comma-separated list (migration `20261029100000_seo_keywords`; backup `prisma/dev.db.bak-before-keywords`).
- **Rules** (`src/lib/keywords.ts`): `parseKeywords` splits on commas and new lines, trims, collapses spaces, drops empties and case-insensitive duplicates, and caps at **15 keywords of 40 characters** each. `joinKeywords` stores them as `"a, b, c"`, or `null` when empty. Both zod payloads (`toolPayload` for admin, `submissionPayload` for public) normalise through it, so the server enforces the same rules whatever the client sends.
- **`KeywordsInput`** (tag field, `src/components/forms/KeywordsInput.tsx`):
  - type and press **Enter** or **comma** to add; paste a comma list to add several at once
  - **✕** or Backspace (on an empty input) removes one; leaving the field adds what was typed
  - shows "N/15"
  - works controlled (`value`/`onChange`, admin form) or uncontrolled (`defaultValue` plus a hidden `name` input, public form)
- **Forms:**
  - **Public submit** (`/submit`) and **edit & resubmit** (`/account/apps/[id]/edit`, pre-filled): an "SEO keywords · optional, up to 15 · what people would search to find your app" field in step 2 "Describe it". Saved through `submissionFields`, used by both POST and PATCH.
  - **Admin add/edit tool:** "SEO keywords" in the Content section.
  - **AI fill:** the prompt now asks for `seoKeywords` (6–10 lowercase search phrases: category terms, use cases, "X alternative"). Arrays or strings are both accepted and normalised. Applying a fill only overwrites keywords when the AI produced some.
- **Where keywords are used:**
  - **app page meta:** `<meta name="keywords">` via `generateMetadata`
  - **site search:** `/tools?q=` also matches `seoKeywords`
  - **AI search:** each app's catalog line includes `keywords: …`, and the keyword fallback weighs them like category (×3)
- Not added to the listing score, to avoid shifting the existing 100-point weights.

## Solved
- `prisma generate` hit Windows EPERM (the query engine DLL was locked) because a dev server was still running under a different PID than `netstat` first showed. Killed the process tree (`taskkill /T`) and generated again.

## Errors
- None.

## Achieves
Verified in Chrome:
- **Public submit:** typed "cold email software" + Enter, "sales outreach," (comma), "Cold Email Software" (ignored as a duplicate), pasted "lead gen, email automation, temp kw", then removed "temp kw" → 4 chips, and the hidden value was "cold email software, sales outreach, lead gen, email automation". Submitted.
- **Admin:** the edit form showed the same 4 chips. Added "admin added kw" and published → the app page has `<meta name="keywords" content="cold email software,sales outreach,lead gen,email automation,admin added kw">`, and `/tools?q=lead gen` finds it.
- **AI fill** for "Notion" returned "all-in-one workspace, note taking app, project management software, team wiki tool, notion alternative, …".

The test app (with 2 uploaded files), its notification and the test account were deleted. `tsc` + `eslint` are clean.
