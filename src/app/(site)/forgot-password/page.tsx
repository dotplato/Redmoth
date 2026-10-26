import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { NOINDEX } from "@/lib/seo";

export const metadata = { title: "Forgot password", ...NOINDEX };

export default function Page() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="relative flex w-full justify-center">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
