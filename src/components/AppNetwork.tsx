"use client";

import { useEffect, useRef } from "react";
import { HERO_SLOTS } from "@/lib/hero-slots";
import { SYMBOL_SRC } from "./SiteLogo";

export type NetworkApp = { name: string; slug: string; logoUrl: string | null };

// Slot positions are shared with the admin hero editor (src/lib/hero-slots.ts).
const SLOTS = HERO_SLOTS;

type Item = {
  name: string;
  /** Empty slot: a dashed "Your app here" tile linking to the submit form. */
  placeholder?: boolean;
  url: string;
  logoUrl?: string | null;
  cell: [number, number];
  route?: "x" | "y";
  wire?: SVGPathElement;
  flow?: SVGPathElement;
  wireGroup?: SVGGElement;
  el?: SVGAElement;
  enter?: SVGGElement;
  bump?: SVGGElement;
  shadow?: SVGGElement;
  labelRect?: SVGRectElement;
  labelText?: SVGTextElement;
};

/**
 * Isometric "app network": the redmoth hub wired to real listings, with data packets flowing out
 * to each app. Ported from the standalone redmoth-app-network.html; tiles show the apps' logos.
 */
/** `apps[i]` fills slot i; `null` (or a missing entry) shows a "Your app here" placeholder. */
export function AppNetwork({ apps }: { apps: (NetworkApp | null)[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const key = apps.map((app) => (app ? `${app.slug}:${app.logoUrl ?? ""}` : "-")).join("|");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const HUB: Item = { name: "redmoth", url: "/tools", cell: [0, 0] };
    // Real listings take the first slots; any left over invite makers to list their app.
    const APPS: Item[] = SLOTS.map((slot, i) =>
      apps[i]
        ? { name: apps[i]!.name, url: `/tools/${apps[i]!.slug}`, logoUrl: apps[i]!.logoUrl, cell: slot.cell, route: slot.route }
        : { name: "Your app here", url: "/submit", placeholder: true, cell: slot.cell, route: slot.route },
    );
    const LIVE = APPS.filter((app) => !app.placeholder);

    const NS = "http://www.w3.org/2000/svg";
    const CW = 110;
    const CH = 55;
    const iso = (gx: number, gy: number): [number, number] => [((gx - gy) * CW) / 2, ((gx + gy) * CH) / 2];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = <T extends SVGElement>(tag: string, attrs: Record<string, string | number> = {}, parent?: Element) => {
      const node = document.createElementNS(NS, tag) as T;
      for (const k in attrs) node.setAttribute(k, String(attrs[k]));
      if (parent) parent.appendChild(node);
      return node;
    };

    const timers: number[] = [];
    let interval: number | undefined;
    let frame = 0;

    /* ---------- svg + defs ---------- */
    const svg = el<SVGSVGElement>("svg", {
      viewBox: "-640 -215 1280 390",
      role: "presentation",
      // Narrow screens crop to the centre instead of shrinking the whole wide scene.
      preserveAspectRatio: "xMidYMid slice",
    }, root);
    const defs = el("defs", {}, svg);
    const glow = el("filter", { id: "tm-glow", x: "-60%", y: "-60%", width: "220%", height: "220%" }, defs);
    el("feGaussianBlur", { stdDeviation: 9 }, glow);
    const soft = el("filter", { id: "tm-soft", x: "-60%", y: "-60%", width: "220%", height: "220%" }, defs);
    el("feGaussianBlur", { stdDeviation: 3 }, soft);
    const cast = el("filter", { id: "tm-cast", x: "-60%", y: "-60%", width: "220%", height: "220%" }, defs);
    el("feGaussianBlur", { stdDeviation: 7 }, cast);
    const fade = el("radialGradient", { id: "tm-fade", cx: 0, cy: 0, r: 440, gradientUnits: "userSpaceOnUse", gradientTransform: "scale(1.55 0.6)" }, defs);
    el("stop", { offset: 0, "stop-color": "#fff" }, fade);
    el("stop", { offset: 0.5, "stop-color": "#fff", "stop-opacity": 0.85 }, fade);
    el("stop", { offset: 1, "stop-color": "#fff", "stop-opacity": 0 }, fade);
    const mask = el("mask", { id: "tm-mask" }, defs);
    el("rect", { x: -600, y: -400, width: 1200, height: 800, fill: "url(#tm-fade)" }, mask);
    // Tile sides blend from brand red at the top edge into black at the base (right face a touch darker).
    const sideGradient = (id: string, from: string, mid: string, to: string) => {
      const g = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el("stop", { offset: 0, "stop-color": from }, g);
      el("stop", { offset: 0.45, "stop-color": mid }, g);
      el("stop", { offset: 1, "stop-color": to }, g);
    };
    sideGradient("tm-side-l-fill", "#ea2629", "#a3171a", "#1c1414");
    sideGradient("tm-side-r-fill", "#c81e21", "#7d1214", "#0b0b0b");
    // Hub: a solid black block. Each side catches a little light at its top edge and falls to deep black;
    // the right face sits further from the light, and the top has a faint white→grey sheen.
    const hubGradient = (id: string, stops: [number, string][], x2 = 0, y2 = 1) => {
      const g = el("linearGradient", { id, x1: 0, y1: 0, x2, y2 }, defs);
      stops.forEach(([offset, color]) => el("stop", { offset, "stop-color": color }, g));
    };
    hubGradient("tm-hub-l", [[0, "#7a7a73"], [0.12, "#4a4a45"], [0.7, "#2a2a27"], [1, "#161614"]]);
    hubGradient("tm-hub-r", [[0, "#2c2c29"], [0.12, "#151513"], [0.7, "#080807"], [1, "#000000"]]);
    // Specular highlight running down the front vertical corner where the two sides meet.
    hubGradient("tm-corner", [[0, "rgba(255,255,255,0.75)"], [0.5, "rgba(255,255,255,0.18)"], [1, "rgba(255,255,255,0)"]]);
    hubGradient("tm-hub-top", [[0, "#ffffff"], [0.55, "#f4f4f1"], [1, "#dcdcd6"]], 1, 1);
    // App tile tops: lit from the back-left, a touch greyer toward the front corner.
    hubGradient("tm-top-sheen", [[0, "#ffffff"], [0.6, "#fafaf7"], [1, "#e6e6e0"]], 1, 1);
    // Rounded clip for logo images on tile faces.
    const clip = el("clipPath", { id: "tm-logo-clip" }, defs);
    el("rect", { x: -19, y: -19, width: 38, height: 38, rx: 8 }, clip);

    /* ---------- ground grid ---------- */
    const gridLayer = el<SVGGElement>("g", { class: "tm-grid-layer", mask: "url(#tm-mask)", "aria-hidden": "true" }, svg);
    const cellPoly = (gx: number, gy: number, s = 1) => {
      const [x, y] = iso(gx, gy);
      const w = (CW / 2) * s;
      const h = (CH / 2) * s;
      return `${x},${y - h} ${x + w},${y} ${x},${y + h} ${x - w},${y}`;
    };
    for (let k = -8; k <= 8; k++) {
      const a = iso(k + 0.5, -8.5);
      const b = iso(k + 0.5, 8.5);
      const c = iso(-8.5, k + 0.5);
      const d = iso(8.5, k + 0.5);
      el("line", { class: "tm-grid-line", x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, gridLayer);
      el("line", { class: "tm-grid-line", x1: c[0], y1: c[1], x2: d[0], y2: d[1] }, gridLayer);
    }
    ([[-5, 0], [1, -5], [4, 1], [-1, 5], [1, 1], [-1, -1], [-4, -3], [4, -4]] as [number, number][]).forEach(([gx, gy]) =>
      el("polygon", { class: "tm-grid-cell", points: cellPoly(gx, gy, 0.42) }, gridLayer),
    );
    for (let i = -5; i <= 4; i++)
      for (let j = -5; j <= 4; j++) {
        const [x, y] = iso(i + 0.5, j + 0.5);
        el("circle", { class: "tm-grid-dot", cx: x, cy: y, r: 1.6 }, gridLayer);
      }

    /* ---------- scene layers ---------- */
    const scene = el<SVGGElement>("g", { class: "tm-scene" }, svg);
    const wiresG = el("g", { "aria-hidden": "true" }, scene);
    const nodesG = el("g", { "aria-hidden": "true" }, scene);
    const packetG = el("g", { "aria-hidden": "true" }, scene);
    const tilesG = el("g", {}, scene);

    /* ---------- wires ---------- */
    const nodeSet = new Set<string>();
    APPS.forEach((app) => {
      const [gx, gy] = app.cell;
      const mid: [number, number] = app.route === "x" ? [gx, 0] : [0, gy];
      const p0 = iso(0, 0);
      const p1 = iso(...mid);
      const p2 = iso(gx, gy);
      const d = `M${p0} L${p1} L${p2}`;
      const g = el<SVGGElement>("g", { class: app.placeholder ? "tm-wire-group is-ghost" : "tm-wire-group" }, wiresG);
      app.wire = el<SVGPathElement>("path", { class: "tm-wire", d }, g);
      app.flow = el<SVGPathElement>("path", { class: "tm-flow", d }, g);
      app.wireGroup = g;
      if (p1.join() !== p2.join() && p1.join() !== p0.join()) nodeSet.add(p1.join());
    });
    nodeSet.forEach((p) => {
      const [x, y] = p.split(",").map(Number);
      el("circle", { class: "tm-node", cx: x, cy: y, r: 4 }, nodesG);
    });

    /* ---------- tiles ---------- */
    const shape = (w: number, h: number, d: number) => ({
      top: `0,${-d - h / 2} ${w / 2},${-d} 0,${-d + h / 2} ${-w / 2},${-d}`,
      left: `${-w / 2},${-d} 0,${-d + h / 2} 0,${h / 2} ${-w / 2},0`,
      right: `0,${-d + h / 2} ${w / 2},${-d} ${w / 2},0 0,${h / 2}`,
      edge: `${-w / 2},${-d} 0,${-d + h / 2} ${w / 2},${-d}`,
      base: (s: number, dy: number) => `0,${(-h / 2) * s + dy} ${(w / 2) * s},${dy} 0,${(h / 2) * s + dy} ${(-w / 2) * s},${dy}`,
    });

    function drawIcon(g: SVGGElement, item: Item, isHub: boolean) {
      if (isHub) {
        // The redmoth moth symbol (112×105) centred on the hub.
        el("image", { href: SYMBOL_SRC, x: -24, y: -22.5, width: 48, height: 45, preserveAspectRatio: "xMidYMid meet" }, g);
        return;
      }
      if (item.placeholder) return; // its "+" is drawn upright in buildTile so it doesn't read as "×"
      if (item.logoUrl) {
        el("image", { href: item.logoUrl, x: -19, y: -19, width: 38, height: 38, preserveAspectRatio: "xMidYMid meet", "clip-path": "url(#tm-logo-clip)" }, g);
      } else {
        // No logo: the app's initial, in the heading font.
        const t = el<SVGTextElement>("text", { class: "tm-initial", "text-anchor": "middle", "dominant-baseline": "central" }, g);
        t.textContent = item.name.slice(0, 1).toUpperCase();
      }
    }

    function buildTile(item: Item, isHub: boolean) {
      const w = isHub ? 140 : 100;
      const h = w / 2;
      const d = isHub ? 30 : 16; // a thicker hub reads as a solid block
      const S = shape(w, h, d);
      const [x, y] = iso(...item.cell);
      const a = el<SVGAElement>("a", {
        class: isHub ? "tm-tile tm-hub" : item.placeholder ? "tm-tile tm-ghost" : "tm-tile",
        href: item.url,
        "aria-label": isHub
          ? "Browse all apps on redmoth"
          : item.placeholder
            ? "Submit your app to redmoth"
            : `Open ${item.name} on redmoth`,
        transform: `translate(${x} ${y})`,
      });

      const sh = el<SVGGElement>("g", { class: "tm-shadow" }, a);
      const shi = el("g", { class: "tm-shadow-inner" }, sh);
      el("polygon", { class: "tm-shadow-glow", points: S.base(1.25, 14), filter: "url(#tm-glow)" }, shi);
      // Light comes from the top-left, so the block casts a soft shadow down and to the right…
      el("polygon", { class: "tm-shadow-cast", points: S.base(1.08, 8), transform: `translate(${w * 0.16} ${h * 0.22})`, filter: "url(#tm-cast)" }, shi);
      // …plus a tight, darker contact shadow where it meets the ground.
      el("polygon", { class: "tm-shadow-dark", points: S.base(1.02, 6), filter: "url(#tm-soft)" }, shi);

      const enter = el<SVGGElement>("g", { class: "tm-enter" }, a);
      const lift = el<SVGGElement>("g", { class: "tm-lift" }, enter);
      const bump = el<SVGGElement>("g", { class: "tm-bump" }, lift);
      el("polygon", { class: "tm-side-l", points: S.left }, bump);
      el("polygon", { class: "tm-side-r", points: S.right }, bump);
      el("polygon", { class: "tm-top", points: S.top }, bump);
      el("polyline", { class: "tm-edge", points: S.edge }, bump);
      // Lighting details: bright bevel on the top's back (lit) edges and a highlight down the front corner.
      el("polyline", { class: "tm-bevel", points: `${-w / 2},${-d} 0,${-d - h / 2} ${w / 2},${-d}` }, bump);
      el("line", { class: "tm-corner", x1: 0, y1: -d + h / 2, x2: 0, y2: h / 2 }, bump);
      // Lay the icon flat on the top face: same 2:1 isometric projection as the grid.
      const k = isHub ? 1.4 : 1;
      const a1 = (0.7071 * k).toFixed(4);
      const b1 = (0.3536 * k).toFixed(4);
      drawIcon(el<SVGGElement>("g", { class: "tm-face", transform: `translate(0 ${-d}) matrix(${a1} ${b1} ${-a1} ${b1} 0 0)` }, bump), item, isHub);
      if (item.placeholder) {
        // Upright plus, squashed vertically so it still sits on the tile's top plane.
        const plus = el("g", { class: "tm-plus", transform: `translate(0 ${-d}) scale(1 0.62)` }, bump);
        el("rect", { x: -2.5, y: -12, width: 5, height: 24, rx: 2.5 }, plus);
        el("rect", { x: -12, y: -2.5, width: 24, height: 5, rx: 2.5 }, plus);
      }

      const lw = el("g", { class: "tm-label-wrap", transform: `translate(0 ${-d - h / 2 - 14})` }, lift);
      const lab = el("g", { class: "tm-label" }, lw);
      item.labelRect = el<SVGRectElement>("rect", { y: -29, height: 26, rx: 13 }, lab);
      el("path", { d: "M-6 -4 L0 3 L6 -4Z" }, lab);
      item.labelText = el<SVGTextElement>("text", { y: -11.5, "text-anchor": "middle" }, lab);
      item.labelText.textContent = item.name;

      Object.assign(item, { el: a, enter, bump, shadow: sh });
    }

    const ALL = [HUB, ...APPS];
    ALL.forEach((it) => buildTile(it, it === HUB));
    [...ALL]
      .sort((p, q) => iso(...p.cell)[1] - iso(...q.cell)[1] || iso(...p.cell)[0] - iso(...q.cell)[0])
      .forEach((it) => tilesG.appendChild(it.el!));

    const sizeLabels = () =>
      ALL.forEach((it) => {
        const tw = it.labelText!.getComputedTextLength() + 26;
        it.labelRect!.setAttribute("x", String(-tw / 2));
        it.labelRect!.setAttribute("width", String(tw));
      });
    sizeLabels();
    void document.fonts?.ready.then(sizeLabels);

    /* ---------- hover: light up the wire ---------- */
    const setActive = (it: Item, on: boolean) =>
      (it === HUB ? APPS : [it]).forEach((app) => app.wireGroup!.classList.toggle("is-active", on));
    ALL.forEach((it) => {
      it.el!.addEventListener("pointerenter", () => setActive(it, true));
      it.el!.addEventListener("pointerleave", () => setActive(it, false));
      it.el!.addEventListener("focus", () => setActive(it, true));
      it.el!.addEventListener("blur", () => setActive(it, false));
    });

    /* ---------- workflow packets ---------- */
    const ping = (it: Item) => {
      it.bump!.classList.remove("ping");
      void it.bump!.getBoundingClientRect();
      it.bump!.classList.add("ping");
    };
    let seq = 0;
    let onScreen = true;
    function launch() {
      if (!onScreen || document.hidden) return;
      // Packets only travel to real listings.
      if (!LIVE.length) return;
      const app = LIVE[seq++ % LIVE.length];
      const path = app.flow!;
      const len = path.getTotalLength();
      const pk = el<SVGGElement>("g", {}, packetG);
      el("circle", { class: "tm-packet-glow", r: 8 }, pk);
      el("circle", { class: "tm-packet-core", r: 3.6 }, pk);
      app.wireGroup!.classList.add("is-live");
      ping(HUB);
      const dur = Math.max(650, len * 3.2);
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const p = path.getPointAtLength(e * len);
        pk.setAttribute("transform", `translate(${p.x} ${p.y})`);
        if (k < 1) frame = requestAnimationFrame(step);
        else {
          pk.remove();
          app.wireGroup!.classList.remove("is-live");
          ping(app);
        }
      };
      frame = requestAnimationFrame(step);
    }
    const startPackets = () => {
      if (interval) return;
      launch();
      interval = window.setInterval(launch, 1100);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    observer.observe(root);

    /* ---------- gentle parallax ---------- */
    const onMove = (event: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const nx = (event.clientX - r.left) / r.width - 0.5;
      const ny = (event.clientY - r.top) / r.height - 0.5;
      scene.style.transform = `translate(${nx * -14}px, ${ny * -8}px)`;
      gridLayer.style.transform = `translate(${nx * -6}px, ${ny * -3}px)`;
    };
    const onLeave = () => {
      scene.style.transform = "";
      gridLayer.style.transform = "";
    };
    const parallax = !reduce && window.matchMedia("(hover: hover)").matches;
    if (parallax) {
      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", onLeave);
    }

    /* ---------- flying moths ---------- */
    // A few small moths (the logo symbol) wander over the scene. Decorative only: no pointer events
    // (see .tm-moths), paused off-screen, and not shown at all with reduced motion.
    const MOTH_COUNT = 10;
    const MOTH_SIZE = { min: 16, max: 28 }; // width in scene units
    const MOTH_SPEED = { min: 30, max: 60 }; // scene units per second
    const MOTH_FLAP_HZ = { min: 2.5, max: 4 };
    const MAX_TURN = 2; // radians per second
    const VERTICAL_DAMPING = 0.6; // the scene is wide and short, so flight leans horizontal
    const FLIP_SPEED = 6; // |horizontal speed| needed before a moth turns to face the other way
    const MAX_TILT_DEG = 35;
    const MAX_FRAME_SECONDS = 0.05; // after a stall (hidden tab), resume instead of jumping
    // Inside the viewBox (-640…640, -215…175), so moths stay mostly in view.
    const BOUNDS = { x: 580, top: -185, bottom: 150 };
    const SYMBOL_RATIO = 105.215 / 112.212; // logo-symbol.svg height / width
    // Each moth keeps to its own stretch of the scene (homes spaced evenly across the width) so both
    // sides always have moths; neighbouring stretches overlap so they still mingle.
    const HOME_SPACING = (BOUNDS.x * 2) / MOTH_COUNT;
    const HOME_RANGE = HOME_SPACING * 1.5;

    type Moth = {
      g: SVGGElement;
      wings: SVGGElement;
      x: number;
      y: number;
      homeX: number;
      heading: number;
      turn: number;
      speed: number;
      flapHz: number;
      phase: number;
      facingLeft: boolean;
    };
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const mothsG = el<SVGGElement>("g", { class: "tm-moths", "aria-hidden": "true" }, svg);
    const moths: Moth[] = reduce
      ? []
      : Array.from({ length: MOTH_COUNT }, (_, i) => {
          const width = rand(MOTH_SIZE.min, MOTH_SIZE.max);
          const height = width * SYMBOL_RATIO;
          const g = el<SVGGElement>("g", {}, mothsG);
          const wings = el<SVGGElement>("g", {}, g);
          el("image", { href: SYMBOL_SRC, x: -width / 2, y: -height / 2, width, height }, wings);
          const heading = rand(0, Math.PI * 2);
          const homeX = -BOUNDS.x + HOME_SPACING * (i + 0.5);
          return {
            g,
            wings,
            x: homeX + rand(-HOME_SPACING, HOME_SPACING) / 2,
            y: rand(BOUNDS.top, BOUNDS.bottom),
            homeX,
            heading,
            turn: 0,
            speed: rand(MOTH_SPEED.min, MOTH_SPEED.max),
            flapHz: rand(MOTH_FLAP_HZ.min, MOTH_FLAP_HZ.max),
            phase: rand(0, Math.PI * 2),
            facingLeft: Math.cos(heading) < 0,
          };
        });

    const moveMoth = (m: Moth, dt: number, seconds: number) => {
      // Wander: the turn rate itself drifts randomly. Once outside the scene or its own stretch,
      // steer back toward its home point instead.
      const outside =
        Math.abs(m.x) > BOUNDS.x || Math.abs(m.x - m.homeX) > HOME_RANGE || m.y < BOUNDS.top || m.y > BOUNDS.bottom;
      if (outside) {
        const toHome = Math.atan2(-m.y, m.homeX - m.x);
        const off = Math.atan2(Math.sin(toHome - m.heading), Math.cos(toHome - m.heading));
        m.turn = Math.sign(off) * MAX_TURN;
      } else {
        m.turn = Math.max(-MAX_TURN, Math.min(MAX_TURN, m.turn + rand(-6, 6) * dt));
      }
      m.heading += m.turn * dt;

      const vx = Math.cos(m.heading) * m.speed;
      const vy = Math.sin(m.heading) * m.speed * VERTICAL_DAMPING;
      m.x += vx * dt;
      m.y += vy * dt;

      // Face the direction of travel (the symbol faces right), tilting a little when climbing or diving.
      if (Math.abs(vx) > FLIP_SPEED) m.facingLeft = vx < 0;
      const tiltDeg = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, (Math.atan2(vy, Math.abs(vx)) * 180) / Math.PI));
      m.g.setAttribute(
        "transform",
        `translate(${m.x} ${m.y}) rotate(${m.facingLeft ? -tiltDeg : tiltDeg}) scale(${m.facingLeft ? -1 : 1} 1)`,
      );
      // Wing beat: squash the symbol vertically.
      const beat = Math.abs(Math.sin(seconds * m.flapHz * Math.PI + m.phase));
      m.wings.setAttribute("transform", `scale(1 ${0.55 + 0.45 * beat})`);
    };

    let mothFrame = 0;
    let lastFlight = performance.now();
    const fly = (now: number) => {
      const dt = Math.min(MAX_FRAME_SECONDS, (now - lastFlight) / 1000);
      lastFlight = now;
      if (onScreen && !document.hidden) moths.forEach((m) => moveMoth(m, dt, now / 1000));
      mothFrame = requestAnimationFrame(fly);
    };
    if (moths.length) mothFrame = requestAnimationFrame(fly);

    /* ---------- intro sequence ---------- */
    if (reduce) {
      root.classList.add("tm-ready");
    } else {
      ALL.forEach((it, i) => {
        const delay = `${i * 110}ms`;
        it.enter!.style.animationDelay = delay;
        it.shadow!.style.animationDelay = delay;
        it.enter!.classList.add("in");
        it.shadow!.classList.add("in");
      });
      const wireStart = 650;
      APPS.forEach((app, i) => {
        const len = app.wire!.getTotalLength();
        const s = app.wire!.style;
        s.strokeDasharray = String(len);
        s.strokeDashoffset = String(len);
        s.transition = `stroke-dashoffset .9s cubic-bezier(.6,0,.2,1) ${wireStart + i * 90}ms`;
      });
      frame = requestAnimationFrame(() =>
        requestAnimationFrame(() => APPS.forEach((app) => (app.wire!.style.strokeDashoffset = "0"))),
      );
      timers.push(
        window.setTimeout(() => {
          APPS.forEach((app) => app.wire!.removeAttribute("style"));
          root.classList.add("tm-ready");
          startPackets();
        }, wireStart + APPS.length * 90 + 950),
      );
    }

    return () => {
      timers.forEach(clearTimeout);
      if (interval) clearInterval(interval);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(mothFrame);
      observer.disconnect();
      if (parallax) {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", onLeave);
      }
      root.classList.remove("tm-ready");
      root.replaceChildren();
    };
    // `key` captures the app list contents; re-render with the same apps shouldn't rebuild the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <section ref={rootRef} className="tm-network" aria-label="Apps on the redmoth marketplace" />;
}
