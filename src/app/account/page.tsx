import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, LayoutDashboard, Package } from "lucide-react";
import { AddressList } from "@/components/account/AddressList";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Container, PageHeader } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Feedback";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/types";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, full_name, phone, line1, line2, city, state, pincode, is_default")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const card = "rounded-2xl border border-neutral-100 p-6";
  const quick = "flex items-center gap-3 rounded-xl border border-neutral-100 p-4 text-sm font-semibold hover:border-brand-200 hover:bg-brand-50/40";

  return (
    <Container className="space-y-8 py-10">
      <PageHeader title="My account" description={`Signed in as ${user.email}`} />
      {sp.password === "updated" && <Alert tone="green">Your password has been updated.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/account/orders" className={quick}>
          <Package className="size-5 text-brand-600" /> My orders
        </Link>
        <Link href="/reset-password" className={quick}>
          <KeyRound className="size-5 text-brand-600" /> Change password
        </Link>
        {user.isAdmin && (
          <Link href="/admin" className={quick}>
            <LayoutDashboard className="size-5 text-brand-600" /> Admin dashboard
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className={card}>
          <h2 className="mb-5 text-lg font-semibold">Your details</h2>
          <ProfileForm
            email={user.email}
            fullName={user.profile?.full_name ?? ""}
            phone={user.profile?.phone ?? ""}
          />
        </section>
        <section className={card}>
          <h2 className="mb-5 text-lg font-semibold">Saved addresses</h2>
          <AddressList addresses={(addresses ?? []) as Address[]} />
        </section>
      </div>
    </Container>
  );
}
