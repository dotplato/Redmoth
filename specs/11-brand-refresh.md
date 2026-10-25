# 11 — Brand Refresh (Righteous + Sansation, yellow/black)

## Did
- **Fonts:** headings use Righteous (single weight 400, via `next/font`, `--font-righteous`). Every `h1`–`h3` and `.font-display` uses it automatically. All other text uses Sansation (300/400/700, `--font-sansation`), including small labels, slugs, and domains. Geist, Geist Mono, and Instrument Serif were removed.
- **Palette:** primary `#ffd500` (`--accent`, hover `#f0c800`, soft `#fff7c7`), with near-black `#0b0b0b` for text, primary buttons, and the brand mark. The background is a neutral `#f7f7f4`, gray lines, and white surfaces. The yellow hero glow and focus ring (ink outline + yellow halo) follow the new palette.
- **How yellow is used:** as a fill, always with black text on top. Accent buttons (Visit, New tool, AI fill), the solid `.tag-featured`, active category chips, the highlighted stat card (admin overview/analytics), the admin mobile nav's active pill, the sidebar's active edge, analytics bars, and the brand dot. Black is used for generic primary buttons (Search, Explore, Save).
- Replaced the italic orange accent words with a `.mark` yellow highlighter stroke, because Righteous has no italic.

## Solved
- Sansation has no 500/600 weights, so `font-medium`/`font-semibold` were mapped to `font-bold` to avoid uneven rendering, and synthetic bold was removed from Righteous headings.
- Yellow text on a light background is unreadable, so every former `text-[var(--accent)]` became a yellow fill or the highlighter.
- At the old size, the wider Righteous wrapped the hero headline onto 3 lines. It now has a set 2-line break and a smaller size (`lg:text-[3.9rem]`).
- The tool page's "About" lead paragraph was in the display font. It's now bold Sansation, so Righteous stays on headings only.

## Errors
- Restarting `npm run dev` found the original server still running on :3000 (PID 24896, a Windows process left from the earlier session), so the new one exited. That server hot-reloaded the changes; screenshots were taken from it.

## Achieves
One consistent yellow-and-black identity across the storefront and admin, with balanced use of the accent. `tsc` and `eslint src` pass, and there's no horizontal overflow at 390px.
