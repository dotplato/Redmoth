# 14 — AI Search + Centered Hero with Floating Cards

## Did
- **AI search** (`src/lib/ai-search.ts`, page `/search?q=`): the hero search sends a plain-language need to `/search`. The server builds one compact, numbered line per published app (name — tagline | category | free tier/paid | 140-char description | 160-char example scenario) and asks the OpenRouter model (`OPENROUTER_MODEL`, currently Nemotron 3 Ultra `:free`, **no web plugin**, so $0) for `{"results":[{"n","why"}]}`: up to 6 apps that genuinely fit, best first, with a ≤18-word "why it fits". It skips loosely related apps, returns an empty list when nothing fits, and respects "free" requests. Numbers instead of IDs keep the prompt small and make invented apps impossible: unknown numbers are dropped.
- **Results page:** a centered header with the query in a re-search box, then results streamed in through `<Suspense>` with a skeleton ("Reading every listing…"). Cards are the normal `ToolCard` with a new yellow "Why it fits" note. A badge shows "Ranked by AI" or "Keyword match (AI busy)". The empty state offers example prompts and the catalog.
- **Cost/abuse controls:** AI answers are cached in memory for 10 min (max 200 queries); there's a per-client limit of 8 AI searches/min; above 80 apps the catalog is keyword-prefiltered before prompting. When the model fails, is rate-limited, or the key is missing, a weighted keyword ranker answers instead, and that fallback isn't cached. Each call logs `[ai-search] in X / out Y tokens, $cost`.
- **Hero:** everything is centered: eyebrow, headline, new copy about AI matching, the AI search box (`AiSearchBox`, yellow ✦, "Find apps") with "Try:" example prompts, and stats. The old right-hand card stack is gone. **Floating cards** (`FloatingCards`): 6 real listings (logo-bearing first), 3 per side, each bobbing with its own tilt/duration/phase (`.floaty` keyframes), fading in staggered, pausing on hover, still for reduced-motion, links to the tool, shown at ≥1280px only.

## Solved
- At 1280px the middle cards overlapped the search box. They're now positioned from the center line (`max(0.5%, calc(50% - 36rem))`) and are 12rem wide below 2xl. A geometry check found 0 overlaps with hero content at 1280/1366/1440/1536/1920.
- The first overlap check counted each card's own `p.eyebrow` as content. Fixed in the test, not the app.
- Testing the fallback with an empty key didn't work: Prisma loads `.env` itself, and an empty WSL variable isn't forwarded to Windows Node. Used an invalid key via `WSLENV` instead.

## Errors
- The cache and rate limit are in-process. With several server instances, use a shared store (e.g. Redis).
- The free model allows 50 requests/day account-wide. Past that, searches use the keyword fallback until it resets, or until credits are added / the model is switched.

## Achieves
Verified live (2–3.5s, ~430 input tokens, $0 each):
- "answer customer support emails automatically" → Orbitmail
- "make diagrams and wireframes with my team" → Excalidraw
- "free tool for writing blog posts" → Northline (free tier)
- "book flights cheaply" → no results

Fallback with an invalid key returned keyword matches. No horizontal overflow at 1024/1280/1440/390. `tsc` + `eslint` are clean.

## Follow-up — placeholder + categories instead of prompt suggestions
- **Did:** the search placeholder is now "Describe what you need, it'll find for you". The "Try:" example prompts are removed everywhere (hero, empty `/search`, and the no-results state) and replaced by a "Browse:" row of category chips with published-tool counts, linking to `/tools?category=…`. Only categories with at least one published tool are shown (new `categoryChips()` query). `AiSearchBox` takes `categories` instead of `examples`, and `CategoryChips` is reusable.
- **Verified:** the placeholder text, 4 chips on home and on `/search`, no "Try:" text left. `tsc` + `eslint` are clean.

## Follow-up — bigger title, no subtitle
- **Did:** removed the hero subtitle paragraph. The headline grew from 4.1rem → 5.4rem on desktop and from 6xl → 7xl on tablets. The hero column widened from `max-w-3xl` → `max-w-4xl` so "making room for." stays on one line. Phones stay at 2.6rem: anything larger wraps the headline to 3 lines at 390px.
- **Verified:** the headline is 2 lines at 390/1024/1280/1366/1440/1536/1920, and 0 floating cards overlap the headline, search or stats at any of those widths. `eslint` is clean.

## Follow-up — new title "Skip the noise / Find the right tool"
- **Did:** the hero title is now "Skip the noise" / "Find the **right tool**" (yellow highlight on "right tool", kept on one line). It's longer than the old title, so: desktop 5rem (was 5.4rem; still above the original 4.1rem), tablet 7xl, phone 2.25rem; the hero column is `max-w-5xl`; and the cards beside the search box sit 38rem from the center (was 36rem).
- **Solved:** at 1536px+ the wider second line touched the middle floating cards (2 overlaps). After the changes above there are none.
- **Verified:** 2 lines and 0 card overlaps at 360/390/414/768/1024/1280/1366/1440/1536/1920. On phones the long search placeholder is cut off at the box edge (normal input behavior).

## Follow-up — yellow second title line
- **Did:** "Find the right tool" is now fully brand yellow (`var(--accent)`, #ffd500), and the highlighter stroke on "right tool" is removed. "Skip the noise" stays black.
- **Note:** yellow on the off-white background has low contrast (~1.4:1). It reads at display size but would fail WCAG for normal text. If needed, a thin black outline (`-webkit-text-stroke` / `paint-order: stroke`) would keep the yellow and lift legibility.
- **Verified:** still 2 lines and 0 card overlaps at 1440 and 390. `eslint` is clean.

## Follow-up — title copy "No noise. / Just the right tool"
- **Did:** the hero title is now "No noise." (black) / "Just the right tool" (brand yellow). The sizes and layout are unchanged.
- **Verified:** 2 lines and 0 floating-card overlaps at 360/390/768/1280/1440/1920. `eslint` is clean.
