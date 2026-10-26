import { SubmitToolForm } from "@/components/forms/SubmitToolForm";
import { getCurrentCreator } from "@/lib/creator-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit Your AI Tool — Free Listing",
  description: "List your AI tool on redmoth for free. Add screenshots, pricing and a real-world example, and reach people looking for the right tool.",
  alternates: { canonical: "/submit" },
};

export default async function SubmitPage() {
  // Submitting needs a creator account: sign up (or log in) first, then come straight back here.
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signup?next=/submit");
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="glow pointer-events-none absolute inset-0" />
        <div className="container-page relative py-12 sm:py-16">
          <p className="eyebrow">Free listing</p>
          <h1 className="mt-3 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            Submit your <span className="mark">app</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Tell us what you&rsquo;ve built, add a logo and a few screenshots, and we&rsquo;ll
            review it before it goes live.
          </p>
        </div>
      </section>
      <div className="container-page max-w-6xl py-10 pb-24">
        <SubmitToolForm
          categories={categories}
          creator={{ name: creator.name, email: creator.email }}
        />
      </div>
    </div>
  );
}
