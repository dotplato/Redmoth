import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { getCreatorSession, safeNext } from "@/lib/creator-auth";
import { NOINDEX } from "@/lib/seo";

export const metadata = { title: "Log in", ...NOINDEX };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCreatorSession()) redirect(next);
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="relative flex w-full justify-center">
        <AuthForm mode="login" next={next} />
      </div>
    </div>
  );
}
