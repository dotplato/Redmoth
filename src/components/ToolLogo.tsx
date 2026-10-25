const sizes = {
  sm: "h-10 w-10 rounded-xl text-sm",
  md: "h-12 w-12 rounded-[14px] text-base",
  lg: "h-20 w-20 rounded-[22px] text-2xl",
};

export function ToolLogo({
  src,
  name,
  size = "md",
}: {
  src: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${sizes[size]} shrink-0 bg-white object-contain p-0.5 ring-1 ring-[var(--line)]`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${sizes[size]} font-display grid shrink-0 place-items-center bg-[var(--accent-soft)] text-[var(--accent-ink)] ring-1 ring-[var(--line)]`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
