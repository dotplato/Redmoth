# 16 — Four-Step Scenario + Listing Score Meter

## Did
- **Data:** migration `20261023100000_scenario_steps` adds `Tool.scenarioUser`, `scenarioProblem`, `scenarioHow`, `scenarioResult`. `exampleScenario` stays as the joined paragraph, because AI search, the compare page, admin and older listings use it. The DB was backed up first to `prisma/dev.db.bak-before-scenario-steps`.
- **`src/lib/scenario.ts`:** one definition of the 4 steps (Real user / Problem / How it helps / Result, with hints and placeholders), the built-in Sara example, `scenarioSteps()` (ordered, punctuated steps), `joinScenario()` and `withScenario()`. The admin create/update routes use `withScenario()` to rebuild the paragraph when any step is edited, and leave legacy paragraphs untouched otherwise.
- **Submit form:** the single scenario textarea is replaced by 4 required step fields (8–300 chars each, validated server-side; each error scrolls to its field). The side box (`ScenarioGuide`) has an **Example / Your preview** toggle. The preview shows the maker's own steps in the exact interactive view the app page will use, with missing steps as muted placeholders.
- **Shared interactive view** (`ScenarioSteps`): numbered step tabs plus the paragraph with the active step highlighted in yellow. It auto-cycles every 2.6s and pauses on hover, click or focus (no autoplay for reduced-motion users). Used by the submit form's example and preview **and** the app page's "In practice" card (`ScenarioCard`). Listings without steps (e.g. older Excalidraw) fall back to plain paragraph text.
- **Admin editor:** 4 step fields instead of one textarea. If a listing only has an old paragraph, it's shown with a note that filling the steps replaces it.
- **Listing score** (`src/lib/listing-score.ts` + `ScoreMeter`): out of 100, recomputed on every form change from the live `FormData`.

  | Check | Points |
  |---|---|
  | Name & tagline (4–10 words) | 10 |
  | Website URL | 5 |
  | Category | 5 |
  | Logo | 10 |
  | Short description (60+ chars) | 10 |
  | Details (250+ chars) | 10 |
  | Scenario (4 pts per step of 15+ chars, +4 if the result has a number) | 20 |
  | Screenshots (1 → 6, 2 → 10, 3+ → 15) | 15 |
  | Free tier = yes | 5 |
  | Affiliate = yes with link | 5 |
  | Release date | 5 |

  - **Desktop:** a sticky right panel with an animated ring gauge, a level (Needs work < 40 ≤ Good start < 70 ≤ Strong < 90 ≤ Excellent, colored red/amber/ink/green), the top 3 "Next best steps" with their point gains, and a per-check list.
  - **Mobile:** a compact score pill pinned to the bottom of the screen.
  - The submit page widened to `max-w-6xl` for the side column.

## Solved
- The joined text read "…online store She spends…". `scenarioSteps()` now adds a full stop when a step doesn't end with punctuation and the next starts a new sentence (or it's the last step), and leaves it open when the next continues mid-sentence (the Sara example's "and spends…").
- The guide preview used raw text. It now runs through the same punctuation, so it matches the published box exactly.
- The logo mode switch (Upload ↔ Paste URL) doesn't fire a form change event, so the score re-measures on the next frame after the switch.

## Errors
- The score isn't stored or shown to admins; it only guides makers while they fill the form.

## Achieves
Verified end to end in Chrome:
- the score went 0 → 20 (basics) → 70 (logo, text, 4 steps) → 100 "Excellent" (3 screenshots, free, affiliate + link, release date)
- "Your preview" showed the maker's text, and the submission saved all 4 steps + the paragraph
- after publishing, the app page "In practice" showed tabs 1–4, auto-advanced Real user → Problem after ~2.6s, and clicking "4. Result" highlighted the result sentence
- the admin editor showed all 4 fields filled
- no overflow at 390px, and the mobile pill shows "0 Needs work" on a blank form

Test data was deleted afterwards. `tsc` + `eslint` are clean.

## Follow-up — simpler score panel, multi-screenshot picker with a limit
- **Score panel:** the per-metric checklist is removed. It now shows only the ring gauge with the score, the level, and "How to improve" (top 4 suggestions with their point gain, biggest first), or "Nothing left to improve" at 100. The mobile pill is unchanged.
- **Screenshots:** the native file input replaced its selection on every pick, so a second pick discarded the first. The new `ScreenshotPicker` keeps a growing list in state:
  - it accepts clicks and drag-and-drop, shows numbered thumbnails with ✕ to remove, and shows an "N/6" counter
  - the add tile hides at the limit, and over-limit or invalid files (not PNG/JPG/WebP/GIF ≤ 5 MB) are skipped with a notice
  - on submit, the files are appended to the FormData manually
  - the limits live in `src/lib/upload-limits.ts` (`MAX_SCREENSHOTS = 6`, `MAX_IMAGE_BYTES`, `RASTER_TYPES`), shared by the form, `uploads.ts` and `/api/submit`; the API now rejects more than 6 with "Add up to 6 screenshots" instead of silently truncating
- **Verified in Chrome:** picks of 1, then +2, then +5 → 1/6, 3/6, 6/6 "limit reached" with "Skipped: only 6 screenshots are allowed."; the add tile was hidden; removing #2 → 5/6. The full submission saved **5** screenshots. Test data was deleted. `tsc` + `eslint` are clean.
