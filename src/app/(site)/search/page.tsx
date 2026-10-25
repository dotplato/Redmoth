import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { AiSearchBox, CategoryChips, type CategoryChip } from "@/components/AiSearchBox";
import { FlowCard } from "@/components/FlowCard";
import { ToolCard } from "@/components/ToolCard";
import { aiSearch } from "@/lib/ai-search";
import { categoryChips } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  // Internal search results are thin, near-duplicate pages; keep them out of the index.
  return {
    title: q ? `Tools and flows for “${q.slice(0, 60)}”` : "AI Tool Finder",
    description: "Describe what you need to get done and get matching AI tools and step-by-step workflows.",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim();
  const categories = await categoryChips();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="glow pointer-events-none absolute inset-0" />
        <div className="container-page relative max-w-3xl py-12 text-center sm:py-16">
          <p className="eyebrow">AI finder</p>
          <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
            {q ? (
              <>
                Tools and flows for <span className="mark">your need</span>
              </>
            ) : (
              "What do you need to get done?"
            )}
          </h1>
          <div className="mt-8 text-left">
            <AiSearchBox defaultValue={q} categories={q ? undefined : categories} autoFocus={!q} />
          </div>
        </div>
      </section>

      <section className="container-page py-10 pb-24">
        {q ? (
          // The key restarts the streamed results (and their skeleton) for every new query.
          <Suspense key={q} fallback={<ResultsSkeleton query={q} />}>
            <Results query={q} categories={categories} />
          </Suspense>
        ) : (
          <p className="text-center text-sm text-[var(--muted)]">
            Describe a task in plain words. We&rsquo;ll read every app and flow and pick the ones that fit.
          </p>
        )}
      </section>
    </div>
  );
}

async function Results({ query, categories }: { query: string; categories: CategoryChip[] }) {
  const h = await headers();
  const client = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const { mode, results, flows } = await aiSearch(query, client);
  const found = results.length + flows.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {found
            ? `${[
                results.length ? `${results.length} ${results.length === 1 ? "app" : "apps"}` : "",
                flows.length ? `${flows.length} ${flows.length === 1 ? "flow" : "flows"}` : "",
              ]
                .filter(Boolean)
                .join(" and ")} for “${query}”`
            : `No close matches for “${query}”`}
        </p>
        <span className="eyebrow flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${mode === "ai" ? "bg-[var(--accent)] ring-1 ring-[var(--ink)]" : "bg-[var(--line-strong)]"}`} />
          {mode === "ai" ? "Ranked by AI" : "Keyword match (AI busy)"}
        </span>
      </div>

      {found ? (
        <div className="grid gap-10">
          {results.length ? (
            <div>
              <h2 className="mb-4 text-2xl">
                Tools <span className="text-[var(--faint)]">· {results.length}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map(({ tool, why }) => (
                  <ToolCard key={tool.id} tool={tool} note={why} />
                ))}
              </div>
            </div>
          ) : null}
          {flows.length ? (
            <div>
              <h2 className="mb-4 text-2xl">
                Flows <span className="text-[var(--faint)]">· {flows.length}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {flows.map(({ flow, why }) => (
                  <FlowCard key={flow.id} flow={flow} note={why} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <p className="font-display text-3xl">Nothing fits that yet.</p>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Try describing the task differently, or browse by category.
          </p>
          <CategoryChips categories={categories} className="mt-6" />
          <Link href="/tools" className="btn btn-primary mt-6">
            Discover apps
          </Link>
        </div>
      )}
    </div>
  );
}

function ResultsSkeleton({ query }: { query: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="mb-6 flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--ink)]" />
        Reading every app and flow for “{query}”…
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card animate-pulse p-5">
            <div className="h-12 w-12 rounded-[14px] bg-[var(--bg-deep)]" />
            <div className="mt-5 h-4 w-1/2 rounded bg-[var(--bg-deep)]" />
            <div className="mt-3 h-3 w-5/6 rounded bg-[var(--bg-deep)]" />
            <div className="mt-6 h-12 rounded-xl bg-[var(--bg-deep)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
