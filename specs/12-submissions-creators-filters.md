# 12 — Public Submissions, Creator Accounts, Free-Tier Filter

## Did
- **Schema** (migration `20261022120000_creators_submissions_free_tier`): `Tool.freeTier`, `exampleScenario`, `affiliateProgram`, `affiliateSignupUrl` (from the maker), `affiliateLink` (ours, set by an admin), `submitterEmail`, `submittedAt`; `Creator.email` (unique) + `passwordHash`.
- **Catalog filters:** price (Any / Free tier / Paid only) and sort (Featured / Newest / A–Z), which combine with category and search. They're server-rendered links, so the URLs can be shared. A "Free tier" tag shows on tool cards and the tool page. The home stat "Tracking params" is now "With a free tier".
- **Public submit form** (`/submit`, `POST /api/submit`): no account needed. Same fields as the admin form minus the slug (generated from the name, with `-2`, `-3`… if taken), status and featured. The logo can be uploaded or pasted as a URL, with a preview; there are up to 6 screenshots with previews; and a Yes/No free tier toggle. The example scenario uses the requested placeholder, with an interactive side guide (`ScenarioGuide`): the Sara example cycles through Real user → Problem → How it helps → Result, highlighting each part, and live checks grade the user's draft. Affiliate Yes shows the signup-link field and "Your listing stays free; we simply use our affiliate link to your app."; No shows a recommendation to start one. Anonymous submitters give a maker name + email, and the maker profile is reused or created. Submissions are saved as DRAFT with `submittedAt` so an admin can review them.
- **Creator accounts:** `/signup`, `/login`, `/account` (profile editor with avatar upload + list of their apps with "In review"/status), and logout. The header shows Log in/Account and a yellow "Submit an app" button. A signed-in creator sees "Edit profile" on their public `/creators/[slug]` page and submits under their own profile.
- **Admin:** the tool editor has a "Submitted via the public form … by email" banner at the top, an example scenario field, and Pricing & affiliate (free tier, program Yes/No, the maker's signup link, our affiliate link). Turning the program off clears both links. The tools list shows "Submitted" tags and sorts new submissions first. The overview's Drafts card counts submissions waiting for review. AI fill now also guesses `freeTier`.
- **Visit** (`/go/[slug]`) redirects to `affiliateLink` when one is set, otherwise to `websiteUrl`.

## Solved
- `prisma migrate dev` refuses to run without an interactive terminal. The SQL was generated with `migrate diff --from-schema-datasource … --to-schema-datamodel …` and applied with `migrate deploy`. The DB was backed up first to `prisma/dev.db.bak-before-submissions`. The running dev server locked Prisma's engine on Windows, so it was stopped first.
- **Security:** public uploads only accept PNG/JPG/WebP/GIF up to 5 MB. SVG is refused because it can carry script on our origin. The form has a honeypot field against bots. Creator sessions use their own cookie (`tm_creator`) and a token `kind` check, so a creator token can't act as an admin session and vice versa.
- The site copy promised "No referral tags". That was false once affiliate links are used, so the home page, footer, tool page and admin analytics now say listings are free and some Visit links are affiliate links.
- A disabled placeholder `<select>` option isn't submitted, which gave a raw zod "expected string" error; it now says "Pick a category". Client-side early validation used to hide server errors; the server now validates and returns every field's error at once, and errors clear while the user edits.
- The dev server served stale CSS without the new `.tag-free` rule: edits from WSL to the Windows drive didn't trigger Turbopack's watcher. Restarting the dev server fixed it.

## Errors
- Creators can't edit an app after submitting it yet. Changes go through an admin.
- There's no email verification or password reset for creator accounts.
- No rate limiting beyond the honeypot. Add a CAPTCHA or rate limit before running in public.
- `prisma/dev.db.bak-before-submissions` is a local backup and isn't covered by the `/prisma/*.db` gitignore rule. Delete it once you're happy.

## Achieves
Anyone can list an app without an account, makers can have a managed profile, buyers can filter for free tiers, and affiliate links can be used openly. Verified with a Chrome end-to-end run:
- free filter: 3/3
- validation errors
- anonymous submit with the logo upload and both affiliate notes
- signup → account → submit as a creator → "In review"
- login, with a wrong password rejected
- admin Submitted tags and banner → publish with an affiliate link → public page shows the Free tier tag and "In practice"
- `/go` → 302 to the affiliate link

Test records and their uploads were deleted afterwards. `tsc` and `eslint src` are clean, and there's no horizontal overflow at 390px.

## Follow-up — release date + sign-up prompt placement
- **Did:** added an optional `Tool.releaseDate` (migration `20261022150000_tool_release_date`). It's a date picker next to Category on the submit form and under Classification in the admin editor, and the tool page shows "Released Mon YYYY". The "Want to manage your listings… Sign up as a creator — it's optional." line moved from the form's "About you" section to the page header under "Submit your app", shown only to visitors who aren't logged in.
- **Solved:** dates are stored as UTC midnight and displayed in UTC, so a date never shifts by a day across time zones. A malformed date returns "Use a valid date".
- **Verified:** the submit API stored `2024-03-15T00:00:00Z`, a bad format was rejected, and the moved line shows in the header and is gone from the form. The test record was deleted afterwards. `tsc` + `eslint` are clean.
