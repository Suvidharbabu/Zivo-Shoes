import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Container, PageHeader } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("id, full_name, phone, line1, line2, city, state, pincode, is_default")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <Container className="space-y-8 py-10">
      <PageHeader title="Checkout" />
      <CheckoutForm
        addresses={(data ?? []) as Address[]}
        defaultName={user.profile?.full_name ?? ""}
        defaultPhone={user.profile?.phone ?? ""}
      />
    </Container>
  );
}
