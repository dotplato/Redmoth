import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import { NOINDEX } from "@/lib/seo";

export const metadata = { title: "Reset password", ...NOINDEX };

// Better Auth redirects here from the emailed link with ?token=…, or ?error=INVALID_TOKEN when it has expired.
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="relative flex w-full justify-center">
        <ResetPasswordForm token={error || !token ? null : token} />
      </div>
    </div>
  );
}
