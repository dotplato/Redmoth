import { ToolLogo } from "./ToolLogo";

type StackApp = { name: string; logoUrl: string | null };

const BOX = { md: "h-12 w-12 rounded-[14px] p-1 gap-0.5", lg: "h-20 w-20 rounded-[22px] p-1.5 gap-1" };
const TILE = { md: "rounded-[5px] text-[9px]", lg: "rounded-[8px] text-xs" };

/** A flow's icon: its own logo, or a 2×2 mosaic of the first apps in its stack. */
export function FlowMark({ logoUrl, title, stack, size = "md" }: { logoUrl: string | null; title: string; stack: StackApp[]; size?: "md" | "lg" }) {
  if (logoUrl || !stack.length) return <ToolLogo src={logoUrl} name={title} size={size} />;
  const tiles = stack.slice(0, 4);
  return (
    <span aria-hidden className={`grid shrink-0 grid-cols-2 grid-rows-2 bg-[var(--ink)] ring-1 ring-[var(--line)] ${BOX[size]}`}>
      {tiles.map((app, i) =>
        app.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={app.logoUrl} alt="" className={`h-full w-full bg-white object-contain ${TILE[size]}`} />
        ) : (
          <span key={i} className={`font-display grid place-items-center bg-[var(--accent)] text-[var(--ink)] ${TILE[size]}`}>
            {app.name.slice(0, 1).toUpperCase()}
          </span>
        ),
      )}
      {tiles.length < 4
        ? Array.from({ length: 4 - tiles.length }, (_, i) => <span key={`gap-${i}`} className={`bg-white/10 ${TILE[size]}`} />)
        : null}
    </span>
  );
}

/** Overlapping row of app logos, for showing a stack in a small space. */
export function StackRow({ apps, max = 5 }: { apps: StackApp[]; max?: number }) {
  const shown = apps.slice(0, max);
  const extra = apps.length - shown.length;
  return (
    <span className="flex items-center" aria-label={`Stack: ${apps.map((app) => app.name).join(", ")}`}>
      {shown.map((app, i) =>
        app.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={app.logoUrl} alt="" title={app.name} className="-ml-1.5 h-7 w-7 rounded-lg bg-white object-contain p-0.5 ring-2 ring-[var(--surface)] first:ml-0" />
        ) : (
          <span key={i} title={app.name} className="font-display -ml-1.5 grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-soft)] text-[11px] text-[var(--accent-ink)] ring-2 ring-[var(--surface)] first:ml-0">
            {app.name.slice(0, 1).toUpperCase()}
          </span>
        ),
      )}
      {extra > 0 ? (
        <span className="-ml-1.5 grid h-7 min-w-7 place-items-center rounded-lg bg-[var(--bg-deep)] px-1 text-[11px] font-bold text-[var(--muted)] ring-2 ring-[var(--surface)]">
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
