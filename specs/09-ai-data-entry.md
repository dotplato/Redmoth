# 09 — AI Data Entry

## Did
A slide-in "AI data entry" side panel on the admin tool form (new + edit), opened with "✨ Fill with AI". It takes the tool name, an optional website, a logo, and screenshots. `POST /api/admin/ai-fill` (`src/lib/ai-fill.ts`) calls OpenRouter `nvidia/nemotron-3-ultra-550b-a55b:free` (Nemotron 3 Ultra, free version; earlier `glm-4.7-flash`, `glm-5.2`, and paid Nemotron) and fills name, slug, tagline, description, body, website, creator, and category. Fallback order:
1. **Search**: OpenRouter web plugin (`plugins: [{ id: "web" }]`). Accepted only when the result comes with URL citations.
2. **Third-party**: DuckDuckGo Instant Answer, Wikipedia summary, and the official site's title/meta/text, passed to the model as source material.
3. **Description**: if both fail, the panel asks for a short summary and the model writes the fields from it.

The logo is saved to `public/uploads/logos` and set as Logo URL. Screenshots are held in the form and uploaded to the existing screenshots endpoint after Save. The ToolForm inputs are now controlled so the AI can fill them. `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` live in `.env` (placeholders are in `.env.example`).

## Solved
- OpenRouter returned 402 ("requested up to 128000 tokens, but can only afford 100000") when no `max_tokens` was sent. Fixed by capping `max_tokens: 2000`.
- The model returns `null` for unknown fields, which broke zod parsing. String fields now turn null into `""`.
- Creator/category names from the model are matched against existing rows. A name that doesn't match is shown as a suggestion and is never created automatically.
- Switched to GLM 5.2 and cut token use for the same output: a shorter system/user prompt, web results 5 → 3 with a minimal `search_prompt`, third-party context 8000 → 3000 chars (site text 4000 → 1500), `max_tokens` 2000 → 700, and screenshot filenames dropped from the prompt. Search call measured at 1772/2033 → 1308/1242 input tokens, output ~300 either way. Each call logs `[ai-fill] … in X / out Y tokens, $cost` in the dev server output.
- GLM 5.2 and Nemotron returned `found:false` for the admin's own summary, so the summary step gave empty fields. In that step the system prompt now says the summary is the source of truth.
- Nemotron described the Raycast *extension* for Excalidraw instead of Excalidraw. The web plugin builds its search query from the user message, and the creator list ("Raycast") was in it. The creator/category lists moved to the system prompt, and there's a rule to describe the product itself, not plugins for it.
- Windows `node` under WSL can't see `/tmp`, so test scripts were run from the project directory and then deleted.

## Errors
- The model is used as text-only, so it can't read the logo/screenshot images. Screenshots are only uploaded, not sent to the model. A vision model (e.g. `z-ai/glm-5.3-flash`) could be set via `OPENROUTER_MODEL` later, but images aren't passed to it yet.
- The OpenRouter account has $0 purchased credits (free tier). After ~$0.14 of test usage, paid calls return 402 `in_flight_budget_exhausted`. Add credits, or set `OPENROUTER_MODEL="nvidia/nemotron-3-ultra-550b-a55b:free"` (50 requests/day). The web-search fee is still charged on the free model.
- With the `:free` model, tokens cost $0. The only charge is OpenRouter's web-plugin fee (~$0.007 per search fill), which the admin accepted. A tool that can't be found still pays for one search before falling back.
- The browser UI was not clicked through. Verified with `tsc`, `eslint`, and live calls covering all three tiers (Raycast/Excalidraw → search, Notion → third-party with search disabled, a made-up tool → asks for summary → generated from summary).

## Achieves
An admin types a tool name, optionally adds a logo and screenshots, and gets a filled draft to review and save. This is usually backed by live web sources and falls back gracefully when the tool can't be found.

## Follow-up — AI fill writes the 4 scenario steps and picks pricing reliably
- **Did:**
  - **Scenario:** the model output now includes `scenarioUser`, `scenarioProblem`, `scenarioHow`, `scenarioResult`: an illustrative customer story (an invented persona is allowed) restricted to the tool's real features, with a number in the result. `applyAi` fills the admin form's 4 step fields, only overwriting steps the AI actually wrote.
  - **Pricing:** clearer pricing rules in the prompt (FREE = no paid plans; FREEMIUM = free-forever + paid; FREE_TRIAL = paid with a time-limited trial; PAID = no free plan or trial; CONTACT = sales/quote only). `normalizePricing()` accepts variants like "Free trial", "free-trial" or "freemium".
  - The web-search user message now reads "Tool: X (product overview, pricing plans, free plan or free trial)", so the search pulls plan details.
  - New admin tools start with pricing unselected ("Choose pricing…"), so an undetermined result isn't a silent "Paid". The panel says "Pricing couldn't be determined — choose it manually", and saving without one shows "Check these fields: Pricing model".
  - `max_tokens` raised 700 → 1000 for the extra fields.
- **Solved:** the scenario fields were never part of the AI output. Pricing looked wrong when the model returned null or a variant: the select just stayed on its default "Paid". Jasper was first classed PAID because the search only returned overview pages; with pricing in the search message it's correctly FREE_TRIAL.
- **Verified in Chrome (admin → New tool → AI panel):** Notion → Freemium + 4 steps ("Maya leads product operations…" → "cuts triage time from 6 hours to 30 minutes"); Jasper → Free trial + 4 steps; Superhuman → Freemium + 4 steps. ~$0.007 web-search fee per run. `tsc` + `eslint` are clean.
