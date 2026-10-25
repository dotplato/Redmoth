import { pricingOption } from "@/lib/pricing";

/** Coloured pricing pill (Free, Freemium, Free trial, Paid, Contact). */
export function PricingTag({ pricing, className = "" }: { pricing: string | null | undefined; className?: string }) {
  const option = pricingOption(pricing);
  if (!option) return null;
  return (
    <span
      className={`tag-price ${className}`}
      style={{ "--tag-fg": option.color, "--tag-bg": option.soft } as React.CSSProperties}
    >
      {option.label}
    </span>
  );
}
