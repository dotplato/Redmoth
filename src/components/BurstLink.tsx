import Link from "next/link";

const LAYER_COUNT = 3;

/**
 * Link styled as the animated brand button (`.btn-burst` in globals.css): colour layers sweep up on
 * hover/focus while the label rolls up. The label is rendered twice for the roll; the copy is hidden
 * from screen readers so the link is announced once.
 */
export function BurstLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="btn-burst">
      <span aria-hidden className="btn-burst-bg">
        <span className="btn-burst-layers">
          {Array.from({ length: LAYER_COUNT }, (_, i) => (
            <span key={i} className="btn-burst-layer" />
          ))}
        </span>
      </span>
      <span className="btn-burst-inner">
        <span className="btn-burst-static">{children}</span>
        <span aria-hidden className="btn-burst-hover">
          {children}
        </span>
      </span>
    </Link>
  );
}
