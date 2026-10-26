// Brand assets in public/redmoth-logos.
export const LOGO_SRC = "/redmoth-logos/site-logo.svg";
export const SYMBOL_SRC = "/redmoth-logos/logo-symbol.svg";

/** The redmoth wordmark (moth + name). Set the height with className; the width follows. */
export function SiteLogo({ className = "h-7", alt = "redmoth" }: { className?: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={LOGO_SRC} alt={alt} width={455} height={105} className={`w-auto ${className}`} />;
}
