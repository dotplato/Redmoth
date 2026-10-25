import { redirect } from "next/navigation";
import { FlowForm } from "@/components/forms/FlowForm";
import { getCurrentCreator } from "@/lib/creator-auth";
import { flowFormOptions } from "@/lib/flow-form-data";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create a Flow", ...NOINDEX };

export default async function NewFlowPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const { with: withTool } = await searchParams;
  if (!(await getCurrentCreator())) redirect(`/login?next=${encodeURIComponent(withTool ? `/flows/new?with=${withTool}` : "/flows/new")}`);
  const { apps, categories } = await flowFormOptions();
  // "Create a flow with X" from an app page starts the stack with that app.
  const initialStack = apps.some((app) => app.id === withTool) ? [withTool!] : [];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="glow pointer-events-none absolute inset-0" />
        <div className="container-page relative py-12 sm:py-16">
          <p className="eyebrow">Share how you work</p>
          <h1 className="mt-3 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            Create a <span className="mark">Flow</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Pick the apps you use together, walk through the steps, and publish. It goes live on Discover right away.
          </p>
        </div>
      </section>
      <div className="container-page max-w-6xl py-10 pb-24">
        <FlowForm apps={apps} categories={categories} initialStack={initialStack} />
      </div>
    </div>
  );
}
