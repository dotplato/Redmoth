# 23 — Ranking, Reviews, Discover Page, Flows on App Pages

## Did
- **Reviews** (they didn't exist, and the ranking needs them). Migration `20261028100000_reviews`; backup `prisma/dev.db.bak-before-reviews`.
  - **`ToolReview`** / **`FlowReview`**: rating 1–5, optional comment (max 1000), one per account per item (`@@unique`), cascade on delete.
  - `POST /api/reviews {kind, id, rating, body}` (add or update) and `DELETE /api/reviews {kind, id}`. Login is required. Makers can't review their own app (as creator or submitter), and authors can't review their own flow (403). Tools must be published.
  - **`ReviewSection`** on app and flow pages:
    - big average, stars and a 5→1 histogram
    - for the viewer: a hover/click star picker with labels (Poor…Excellent) and an optional comment; their own review is highlighted with Edit and Delete
    - signed out: "Log in to review" (returns to the page); owners see a note instead of the form
    - the list shows 5 reviews at a time with "Show more"
  - `Stars` / `RatingBadge` (supports partial stars); cards show "★ 4.6 (12)" when reviewed.
- **Ranking formula** (`src/lib/ranking.ts`), shared by tools and flows:
  `score = 1·ln(1+visits) + 3·ln(1+saves) + 2·ln(1+reviews) + 2·(R̄ − 3.5) + 1.5·e^(−age/30d)`, where R̄ = (n·avg + 3·3.5)/(n + 3).
  - **Logs** give diminishing returns, so one viral listing can't bury the rest.
  - **Weights:** a save counts 3× a visit, and a review 2×.
  - **Bayesian rating:** pulls toward 3.5★ until reviews pile up (one 5★ ≈ 3.9, ten ≈ 4.7), so unreviewed listings are neutral.
  - **Freshness:** a boost worth ~1.5 on day one that fades over 1–2 months.
  - **Inputs:** tool visits = Visit (outbound) clicks, the same "users visited" number shown on cards; flow visits = `Flow.visits`.
  - `rankedTools(where)` / `rankedFlows(where)` return each item with `score`, `stats` and `rating`, best first.
- **Discover page `/discover`** (new header link "Discover", before Tools and Flows; the phone search icon now opens it):
  - **Header:** live "N tools · M flows" counts, the AI search box, and Browse all tools / Browse all flows.
  - **Sticky section nav** (Top tools · Suggested flows · Spotlight · Latest). It highlights the section in view based on scroll position, and switches to Latest at the page bottom.
  - **Top tools — leaderboard:** category filter chips (client-side). A podium for #1–#3: #1 is a centred black card, #2 and #3 are stepped lower. Each podium card shows rank, logo, tagline, rating, visits and saves, plus a score bar relative to #1, with save on hover. Ranks #4–#10 are a compact list with pricing, stats and score bar. A "How ranking works" popover explains the formula in plain words.
  - **Suggested flows — carousel** (`FlowCarousel`: snap scrolling, mouse drag, swipe, arrows, progress bar, keyboard arrows). It's personalised via `suggestedFlows()` (`src/lib/suggest.ts`): flows that use apps the viewer saved get +2 score per app (up to 3) and say "Uses Northline, which you saved". Your own flows are left out. Otherwise the reason line is "Rated 4.8★ by 5 people" / "Saved by N people" / "New this fortnight" / "N visits". The subline changes for personalised, signed-in and signed-out viewers.
  - **Spotlight:** the existing auto/drag slider, with admin-featured tools first, topped up with the best-ranked ones.
  - **Latest:** tools and flows in one stream, newest first (24 max), with an Everything / Tools / Flows switch (with counts). Each card shows a Tool/Flow badge and "Added today / 3 days ago" (`timeAgo`), six at a time with "Show more".
- **App page:**
  - **"Flows with {app}"** carousel: ranked flows whose stack contains this app (up to 12), with rank and reason. A **+ Create a flow with {app}** button opens `/flows/new?with=<id>`, which starts the stack (and one step) with that app; signed-out visitors go through login and keep the `with` param. When there are no flows yet, it says so and keeps the button.
  - Reviews sit below, and the breadcrumb now says "Tools".
- **Flow page:** a reviews section above "More flows".
- **Elsewhere:**
  - the home page "Top flows" now uses the ranking
  - `/tools` is titled "All tools" (eyebrow "Browse tools"), since Discover is now its own page
  - `.chip[aria-pressed="true"]` shares the selected-chip style

## Solved
- **Section highlighting:** with an IntersectionObserver, scrolling to Latest still highlighted Spotlight (the section above it overlapped the detection band by a few pixels). It now uses a simple rAF-throttled scroll check ("last section whose top passed 160px", or the last section at the page bottom).
- **Review card height:** your own review card stretched to the height of the summary column. Fixed with `items-start` / `content-start`.
- **Test-script issue (not an app bug):** a check waited for "Your review", which also matched the form label "Your review · optional".

## Errors
- None outstanding. All review data so far came from tests and was deleted, so every listing currently shows "No reviews" and ranks on visits, saves and freshness until real reviews come in.

## Achieves
Verified in Chrome:
- **`/discover`:** sections Top tools → Suggested flows → This week's picks → Latest. The podium and the 5 list rows work, the Ops filter → Forgekit, the "How ranking works" popover opens, the carousel shows "Cold Emailer Workflow" with a reason, and Latest switches between Flows (1) and Everything (6 shown + Show more). The section highlight lands on Latest.
- **App page and reviews:** signed up → Northline page shows "Flows with Northline" with the flow. Saved it, posted 5★ + comment → summary 5.0 / 1 review with Edit and Delete; edited to 4★ → 4.0. On Discover, Northline jumped to #1 ("4.0 (1) · 4 visits · 2 saves · 8.0"), and Suggested flows switched to **"Picked for you"** with "Uses Northline, which you saved". A flow review worked too.
- **Create a flow with Northline** → the form opened with Northline in the stack and one step.
- **Layout:** no overflow at 390px on `/discover`, the app page and the flow page.

Test accounts, reviews and saves were deleted. `tsc` + `eslint` are clean.
