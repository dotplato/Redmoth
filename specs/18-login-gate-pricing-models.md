# 18 — Login Before Submitting + Pricing Models

## Did
- **Login gate:** the header's "Submit an app" button is unchanged. `/submit` now redirects signed-out visitors (307) to `/signup?next=/submit`. The sign-up and login pages read `next` (validated by `safeNext`: same-site paths only, no `//host` or absolute URLs), switch between each other while keeping it, show "Step 1 of 2 · then the submit form" with "Sign up to submit" / "Log in to submit", and on success `router.replace(next)` straight to the form. Already-signed-in visitors to `/signup?next=…` are redirected to `next`.
- **Submit API** requires a creator session and returns 401 `{form: "Please log in…"}` otherwise. The anonymous flow is gone: no email field, and the review email comes from the account.
- **Maker:** a single "Maker or company name" field (required, pre-filled with the account name) plus a "Submitting as Name (email)" note. `resolveMaker()` uses the account's own profile when the name matches; otherwise it reuses a **login-less** maker with that exact name or creates one. It never attaches to another account's profile.
- **Schema** (migration `20261024100000_pricing_and_submitter`; backup `prisma/dev.db.bak-before-pricing`):
  - **`enum Pricing { FREE, FREEMIUM, FREE_TRIAL, PAID, CONTACT }`** replaces `freeTier`. The migration SQL was hand-edited so existing rows map **free tier → FREEMIUM, else → PAID** (Northline, PulseQuery, Lumenboard, Excalidraw → Freemium; others → Paid).
  - Adds `Tool.submittedById` (relation `SubmittedTools`, `onDelete: SetNull`; the maker relation is named `MadeTools`). The account page lists apps where `creatorId` **or** `submittedById` is the user.
- **Pricing everywhere:** `src/lib/pricing.ts` defines labels, URL slugs and colours (Free green, Freemium blue, Free trial amber, Paid grey, Contact purple). `PricingTag` is a coloured outline pill (`.tag-price` driven by `--tag-fg/--tag-bg`), shown on cards, the tool page, spotlight, floating hero cards and compare. `PricingSelect` is a dropdown with a live tag preview, used in the submit form, admin editor, and the AI fill (which now guesses one of the 5 models).
- **Catalog filter:** Price = All · Free · Freemium · Free trial · Paid · Contact (coloured dots, `?pricing=free|freemium|free-trial|paid|contact`, scrolls sideways on mobile). The heading becomes e.g. "Freemium apps".
- **Other changes:** the home stat is "Free to try" (Free + Freemium + Free trial); AI search lists each app's pricing and treats "free" requests as those three; the listing score gives Pricing 3 points when chosen, +2 for a free-to-start model; seed data uses varied pricing.

## Solved
- After the CSS change, the dev server kept serving the old stylesheet even across restarts (tags rendered black). The Turbopack persistent cache in `.next/dev/cache` had missed the WSL edit. Deleting that folder and restarting fixed it. **If styles look stale after an edit, clear `.next/dev/cache`.**
- `prisma migrate diff` would have dropped `freeTier` with no carry-over, so the generated INSERT was patched with a `CASE WHEN "freeTier" THEN 'FREEMIUM' ELSE 'PAID' END`.

## Errors
- Existing data only uses Freemium and Paid until an admin edits listings; the other three colours appear as listings adopt them.

## Achieves
Verified in Chrome:
- signed-out `/submit` → 307 to `/signup?next=/submit`, and the anonymous API → 401
- the header "Submit an app" → "Sign up to submit" → after sign-up lands on `/submit`, maker pre-filled, no email field
- a submission with maker "Acme Co" + Free trial saved the maker as Acme Co, pricing FREE_TRIAL and `submittedById` set, and it appears under the account
- the catalog filter shows all 6 options, `?pricing=freemium` → "Freemium apps · 4", and the tags compute blue/grey
- the admin editor shows all sections plus the pricing select (Northline = Freemium)
- no overflow at 390px

Test data was deleted. `tsc` + `eslint` are clean.
