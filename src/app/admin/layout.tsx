import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    return <div className="flex min-h-screen flex-1 bg-[var(--bg)]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[var(--bg)] lg:flex-row">
      <AdminNav email={session.email} unread={await prisma.adminNotification.count({ where: { read: false } })} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-12">{children}</div>
      </main>
    </div>
  );
}
