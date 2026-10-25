import Link from "next/link";
import { redirect } from "next/navigation";
import { PricingTag } from "@/components/PricingTag";
import { ToolLogo } from "@/components/ToolLogo";
import { VisitButton } from "@/components/VisitButton";
import { prisma } from "@/lib/prisma";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = { title: "Compare AI tools side by side", ...NOINDEX };

const MAX = 4;

type Props = { searchParams: Promise<{ apps?: string; add?: string }> };

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const slugs = [...new Set((params.apps ?? "").split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX);

  // The "add an app" form submits ?apps=…&add=slug; fold it into the list and clean the URL.
  if (params.add) {
    const next = [...new Set([...slugs, params.add])].slice(0, MAX);
    redirect(`/compare?apps=${next.map(encodeURIComponent).join(",")}`);
  }

  const [found, all] = await Promise.all([
    prisma.tool.findMany({
      where: { slug: { in: slugs }, status: "PUBLISHED" },
      include: { category: true, creator: true, screenshots: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.tool.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const tools = slugs.flatMap((slug) => found.filter((tool) => tool.slug === slug));
  const addable = all.filter((tool) => !slugs.includes(tool.slug));
  const without = (slug: string) => {
    const rest = slugs.filter((s) => s !== slug);
    return rest.length ? `/compare?apps=${rest.map(encodeURIComponent).join(",")}` : "/compare";
  };

  const rows: { label: string; render: (tool: (typeof tools)[number]) => React.ReactNode }[] = [
    { label: "Category", render: (t) => t.category.name },
    {
      label: "Pricing",
      render: (t) => <PricingTag pricing={t.pricing} />,
    },
    {
      label: "Released",
      render: (t) =>
        t.releaseDate ? t.releaseDate.toLocaleDateString("en", { month: "short", year: "numeric", timeZone: "UTC" }) : <span className="text-[var(--faint)]">—</span>,
    },
    {
      label: "Made by",
      render: (t) => (
        <Link href={`/creators/${t.creator.slug}`} className="font-bold underline decoration-[var(--line-strong)] underline-offset-4">
          {t.creator.name}
        </Link>
      ),
    },
    { label: "What it does", render: (t) => <span className="text-[var(--ink-soft)]">{t.description}</span> },
    {
      label: "In practice",
      render: (t) =>
        t.exampleScenario ? (
          <span className="block rounded-xl bg-[var(--accent-soft)] p-3 text-[13px] leading-6 text-[var(--ink-soft)]">{t.exampleScenario}</span>
        ) : (
          <span className="text-[var(--faint)]">—</span>
        ),
    },
    {
      label: "Screenshot",
      render: (t) =>
        t.screenshots[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.screenshots[0].imageUrl} alt={t.screenshots[0].alt} className="aspect-[16/10] w-full rounded-xl border border-[var(--line)] object-cover" />
        ) : (
          <span className="text-[var(--faint)]">—</span>
        ),
    },
  ];

  return (
    <div className="container-page py-12 pb-24">
      <p className="eyebrow">Side by side</p>
      <h1 className="mt-3 text-5xl leading-none sm:text-6xl">Compare apps</h1>

      <form action="/compare" className="mt-8 flex flex-wrap items-center gap-2">
        <input type="hidden" name="apps" value={slugs.join(",")} />
        <select name="add" required defaultValue="" disabled={slugs.length >= MAX || !addable.length} className="input h-10 w-auto min-w-56">
          <option value="" disabled>
            {slugs.length >= MAX ? `Up to ${MAX} apps` : "Add an app to compare…"}
          </option>
          {addable.map((tool) => (
            <option key={tool.slug} value={tool.slug}>
              {tool.name}
            </option>
          ))}
        </select>
        <button disabled={slugs.length >= MAX} className="btn btn-primary">
          Add
        </button>
        <span className="text-xs text-[var(--faint)]">
          {tools.length}/{MAX} apps
        </span>
      </form>

      {tools.length ? (
        <div className="card mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-36" />
              {tools.map((tool) => (
                <col key={tool.id} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--line)] align-top">
                <th className="sticky left-0 z-10 bg-[var(--surface)] p-5" />
                {tools.map((tool) => (
                  <th key={tool.id} className="p-5 font-normal">
                    <div className="flex items-start justify-between gap-2">
                      <ToolLogo src={tool.logoUrl} name={tool.name} />
                      <Link
                        href={without(tool.slug)}
                        aria-label={`Remove ${tool.name}`}
                        className="grid h-7 w-7 place-items-center rounded-full text-[var(--faint)] hover:bg-[var(--bg-deep)] hover:text-[var(--ink)]"
                      >
                        ✕
                      </Link>
                    </div>
                    <Link href={`/tools/${tool.slug}`} className="mt-3 block font-display text-xl leading-tight hover:underline">
                      {tool.name}
                    </Link>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{tool.tagline}</p>
                    <VisitButton slug={tool.slug} size="sm" variant="accent" className="mt-4" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[var(--line)] align-top last:border-0">
                  <th scope="row" className="sticky left-0 z-10 bg-[var(--surface)] p-5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                    {row.label}
                  </th>
                  {tools.map((tool) => (
                    <td key={tool.id} className="p-5 leading-6">
                      {row.render(tool)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card mt-8 grid place-items-center px-6 py-16 text-center">
          <p className="font-display text-3xl">Nothing to compare yet.</p>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
            Add apps above, or open any app and tick similar ones under &ldquo;More like this&rdquo;.
          </p>
          <Link href="/tools" className="btn btn-primary mt-6">
            Discover apps
          </Link>
        </div>
      )}
    </div>
  );
}
