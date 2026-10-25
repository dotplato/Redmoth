# 20 — Hero App Network Animation

## Did
- Ported the provided `toolsmade-app-network.html` into **`src/components/AppNetwork.tsx`** (client component). The same isometric scene is built imperatively inside `useEffect`: a fading ground grid, a ToolsMade hub tile with the "T + dot" mark, 6 app tiles that drop in, wires that draw from the hub, and data packets that march out to each app (pinging hub and app). Hover/focus shows a name label and lights that app's wire (the hub lights all of them), with gentle pointer parallax on hover-capable devices. Packets pause off-screen or when the tab is hidden; reduced-motion users get the finished state.
- **Real data:** the tiles use the 6 published apps from the database (those with a logo first). Each `logoUrl` is drawn flat on the tile top with the original isometric matrix, clipped to a rounded square; apps without a logo show their initial in Righteous. Tiles link to `/tools/<slug>`, and the hub links to `/tools`.
- **Cleanup on unmount:** timers, the interval, rAF, the IntersectionObserver and parallax listeners are all removed, and the SVG is cleared, so StrictMode's double mount and navigation don't leak or duplicate. The effect only rebuilds when the app list (slugs and logos) changes.
- **Styles:** the original CSS moved into `globals.css` under `.tm-network`, mapped to the site palette (`--accent`, `--ink`) and fonts (Sansation labels instead of Manrope). The component's own white→yellow background was dropped so it sits on the hero's glow.
- **Hero:** the network sits below the search bar and category chips. The metrics row (Tools listed / Independent makers / Free to try) and the floating cards on both sides were removed (`FloatingCards.tsx` and its `.floaty` CSS deleted), and the now-unused creator count query is gone.

## Solved
- Lint `prefer-const` on the observer. Cleared `.next/dev/cache` before restarting so the new CSS was served (see spec 18).

## Errors
- Wide wordmark logos (e.g. Excalidraw's) look small on the square tile face; square logos read best.

## Achieves
Verified in Chrome:
- the hub + 6 tiles labelled "Open Excalidraw / PulseQuery / Northline / Orbitmail / Forgekit / Lumenboard on ToolsMade", using their DB logos
- the metrics and floating cards are gone
- after the intro the scene is `tm-ready` with packets in flight; hovering the hub shows its label and lights all 6 wires, and clicking it → `/tools`
- no overflow at 390px

`tsc` + `eslint` are clean.

## Follow-up — whole hero fits one screen
- **Did:** the hero is tighter: padding `pt-16/24 pb-16/20` → `pt-8/10 pb-6`; title `lg:text-[5rem]` → `lg:text-[3.5rem]` (sm `7xl` → `5xl`, mobile 2.25 → 2rem); search box `max-w-2xl` → `max-w-xl` with a new `compact` mode on `AiSearchBox` (36px field/button, tighter padding); category chips compact (28px tall, xs text). The network now sizes itself from the viewport height: `max-width: clamp(340px, calc((100svh - 410px) * 2.05), 1000px)`. 2.05 is the scene's aspect ratio, and 410px is the measured space taken by the header, title, search, chips and padding.
- **Solved:** a first estimate of 330px left the hero ~70px too tall on 768/720px-high screens; measured and corrected to 410px.
- **Verified:** hero bottom vs viewport height (all fit): 1920×1080 → 869, 1536×864 → 855, 1440×900 → 869, 1366×768 → 759, 1280×720 → 711, 1024×768 → 759, 390×844 → 514. `tsc` + `eslint` are clean.

## Follow-up — eyebrow shows the live app count
- **Did:** the hero eyebrow "The AI tool catalog" → "{N} apps listed": the number of published apps, thousands-separated ("1,234"), singular "1 app listed", styled uppercase like other eyebrows. Verified in the rendered HTML: "7 apps listed".

## Follow-up — "Discover" naming, new eyebrow, rebalanced hero
- **Did:**
  - **No "catalog" anywhere visitors or admins read it:** nav, page title/eyebrow/h1 ("Discover", eyebrow "Tools and workflows"), tool-page breadcrumb, the creator back link ("← Discover"), the home section eyebrow, "Browse the catalog" buttons → "Discover apps" (404, compare, saved, search), footer ("hand-picked collection"), submit copy ("goes live on Discover", "appears on Discover", "price filter on Discover"), and admin copy (overview, categories, login, "N listed"). Internal identifiers and the AI prompt are unchanged.
  - **Hero eyebrow:** "{N} tools and workflows".
  - **Rebalanced:** content larger (title `lg:4.25rem`/`sm:6xl`/2.25rem, full-size search bar and chips, `max-w-2xl`, more top padding), network smaller (`clamp(320px, (100svh − 480px) × 2.05, 780px)`, so capped at 780px instead of 960px).
- **Verified:** a Chrome scan of /, /tools, a tool page, /compare, /search, 404 and /submit found no "catalog" (text or `<title>`; /tools is "Discover · ToolsMade"). Hero bottom: 1920×1080 → 848, 1536×864 → 848, 1440×900 → 848, 1366×768 → 756, 1280×720 → 708, 1024×768 → 756, 390×844 → 606, so all fit. `tsc` + `eslint` are clean.

## Follow-up — plain hero background
- **Did:** removed the `.glow` (yellow radial gradients) and `.paper-grain` (dot texture) layers from the home hero only, so it sits on the plain page background. The network's own isometric grid is part of the animation and stays. Other pages that use those layers (tool, creator, login, 404…) are unchanged. Verified: 0 glow/grain layers in the hero; screenshot confirmed.

## Follow-up — black-and-yellow tile sides
- **Did:** the tile side faces use vertical gradients defined in the component's `<defs>`: left `#ffd500 → #b89900 → #1c1a14` and right `#e6bd00 → #8a7300 → #0b0b0b` (darker, to keep the lighting). CSS `.tm-side-l/.tm-side-r` reference `url(#tm-side-*-fill)` with the flat yellows as fallback. Tile tops stay white, and the glow under each tile stays yellow. Verified the computed fills use the gradients; screenshot confirmed. The dev cache was cleared for the CSS change.

## Follow-up — solid black hub
- **Did:** the center hub tile gets a `tm-hub` class; CSS makes all its faces black (left side `#1c1a14`, right `#0b0b0b`, top `#16140f` with faint white edge highlights) and the "T" mark white, keeping the yellow dot with a white ring. App tiles keep their yellow→black side gradient and white tops. Verified the computed hub top is rgb(22,20,15), the mark is white, and app sides still use the gradient; screenshot confirmed.
- **Revised:** the hub keeps its white top face and black "T" mark (as before). Only its sides are solid black (`#1c1a14` / `#0b0b0b`). Verified the computed top is white, the side rgb(28,26,20), and the mark ink.

## Follow-up — realistic hub block (matching the admin's reference)
- **Did:** the flat black hub sides looked like a paper cutout, so the hub is now a lit 3D block:
  - **Depth:** 20 → 30, for a chunkier block.
  - **Side gradients** (`tm-hub-l` `#55554f → #2b2b28 → #141412 → #050505`, `tm-hub-r` darker `#3a3a36 → … → #000`): a soft highlight at each side's top edge falling to deep black, with the right face further from the light.
  - **Top:** a diagonal white→`#e9e9e5` sheen, and a near-white rim on the top/side edge.
  - **Corners:** a same-colour 7px round-joined stroke on the top and side polygons rounds them.
  - **Shadow:** the contact shadow under the hub is stronger.
  - App tiles are unchanged. Verified with a 2× close-up screenshot.

## Follow-up — isometric lighting & shadows (all tiles)
- **Did:** a single light source from the top-left, applied consistently:
  - **Face contrast:** top brightest, left mid, right darkest. Hub left `#7a7a73 → #161614`, right `#2c2c29 → #000`.
  - **Top sheen:** every tile top has a diagonal white → `#e6e6e0` sheen (`tm-top-sheen`; the hub uses `tm-hub-top`). The hub's white round-joined rim over its sheen reads as a bevel.
  - **Highlights:** a white **bevel** on each top's two back (lit) edges, a darker crease on the front top edges, and a **specular line** down the front vertical corner (`tm-corner` gradient).
  - **Shadows:** a soft **cast shadow** offset down-right (`tm-cast` blur 7, translated ~16%/22% of the tile) plus a stronger contact shadow, both heavier on the hub.
- **Verified:** 2× close-up and full-scene screenshots in Chrome (dev cache cleared for the CSS).

## Follow-up — wider scene, 14 app slots
- **Did:**
  - **Wider scene:** the viewBox widened from `-400…400` to `-640…640` (1280×390) and the grid fade mask stretches 1.55× horizontally.
  - **More slots:** 8 more on the outer left/right (14 around the hub). Published apps fill the inner ring first (logo-bearing first, up to 14). Empty slots become pale dashed **"Your app here"** tiles with an upright "+" (drawn outside the isometric face matrix so it doesn't read as "×") linking to `/submit`, with dimmed wires. Data packets only travel to real listings.
  - **Layout:** the network moved out of the `max-w-5xl` text column so it spans the screen.
  - **Sizing:** height comes from the viewport (`--tm-h = min(clamp(200px, 100svh − 480px, 380px), (100vw − 32px)/1.9)`) and width is capped at `--tm-h × 3.282`. The SVG uses `preserveAspectRatio="xMidYMid slice"`, so narrow screens crop to the centre instead of shrinking the whole wide scene.
- **Verified:** 7 real apps (Stillframe now included) + 7 placeholders. Hero bottom: 1920×1080 → 848, 1440×900 → 848 (network 1247×380), 1366×768 → 756, 1280×720 → 708, 390×844 → 624, so all fit with no horizontal overflow. A placeholder's hover label reads "Your app here" → `/submit`. `tsc` + `eslint` are clean.
