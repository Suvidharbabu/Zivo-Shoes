import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/queries";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await getOrder(id);
  if (!order || order.user_id !== user.id) notFound();

  return (
    <Container className="space-y-6 py-10">
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft className="size-4" /> All orders
      </Link>
      <OrderDetails order={order} />
    </Container>
  );
}
