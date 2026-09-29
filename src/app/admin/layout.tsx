import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/ui/Container";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Zivo Admin" },
  robots: { index: false, follow: false },
};

/** Every /admin page is guarded here (and every admin action re-checks, and RLS enforces it in the DB). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Admin</p>
            <p className="truncate text-sm text-neutral-600">{admin.email}</p>
          </div>
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
