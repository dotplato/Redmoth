"use client";

import { PRICING_OPTIONS } from "@/lib/pricing";
import { PricingTag } from "../PricingTag";

/** Pricing model dropdown with a live preview of the coloured tag it produces. */
export function PricingSelect({
  value,
  onChange,
  name,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input w-auto min-w-48"
      >
        <option value="" disabled>
          Choose pricing…
        </option>
        {PRICING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {value ? <PricingTag pricing={value} /> : null}
    </div>
  );
}
