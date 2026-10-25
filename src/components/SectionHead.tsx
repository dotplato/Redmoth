export function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display mt-2 text-4xl leading-none sm:text-5xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
