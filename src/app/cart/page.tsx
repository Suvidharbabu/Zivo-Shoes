import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Container, PageHeader } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <Container className="space-y-8 py-10">
      <PageHeader title="Your cart" />
      <CartView />
    </Container>
  );
}
