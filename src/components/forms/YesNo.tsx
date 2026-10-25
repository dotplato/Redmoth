"use client";

/** Two-option segmented control backed by real radio inputs (keyboard + form friendly). */
export function YesNo({
  name,
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  name: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div role="radiogroup" className="inline-flex w-fit rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-1">
      {[
        { label: yesLabel, on: true },
        { label: noLabel, on: false },
      ].map((option) => (
        <label
          key={option.label}
          className={`relative cursor-pointer rounded-full px-5 py-1.5 text-sm font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--ink)] ${
            value === option.on
              ? option.on
                ? "bg-[var(--accent)] text-[var(--ink)]"
                : "bg-[var(--ink)] text-white"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.on ? "yes" : "no"}
            checked={value === option.on}
            onChange={() => onChange(option.on)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
