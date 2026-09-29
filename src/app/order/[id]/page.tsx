import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { PendingRefresher } from "@/components/orders/PendingRefresher";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth";
import { orderNumber } from "@/lib/format";
import { getOrder } from "@/lib/queries";

export const metadata: Metadata = { title: "Order confirmation" };

export default async function OrderConfirmationPage({ params }: PageProps<"/order/[id]">) {
  const { id } = await params;
  await requireUser(`/order/${id}`);
  const order = await getOrder(id);
  if (!order) notFound();

  const isPending = order.status === "pending";

  return (
    <Container className="space-y-10 py-10">
      <div className="flex flex-col items-center text-center">
        {isPending ? (
          <>
            <PendingRefresher />
            <span className="grid size-16 place-items-center rounded-full bg-amber-50 text-amber-600">
              <Clock className="size-8" />
            </span>
            <h1 className="mt-5 text-3xl font-bold">Confirming your payment…</h1>
            <p className="mt-2 max-w-md text-neutral-500">
              This usually takes a few seconds. If you closed the payment window without paying, this order will stay
              unpaid and you can try again from your cart.
            </p>
          </>
        ) : (
          <>
            <span className="grid size-16 place-items-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 className="size-8" />
            </span>
            <h1 className="mt-5 text-3xl font-bold">Thank you for your order!</h1>
            <p className="mt-2 max-w-md text-neutral-500">
              Order {orderNumber(order.id)} is confirmed. A confirmation email is on its way to {order.customer_email}.
            </p>
          </>
        )}
        <div className="mt-6 flex gap-3">
          <ButtonLink href="/account/orders" variant="secondary">
            My orders
          </ButtonLink>
          <ButtonLink href="/search">Continue shopping</ButtonLink>
        </div>
      </div>
      <OrderDetails order={order} />
    </Container>
  );
}
