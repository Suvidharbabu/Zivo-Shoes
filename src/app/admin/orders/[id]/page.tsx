import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { Alert } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";
import { getOrder } from "@/lib/queries";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft className="size-4" /> All orders
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-neutral-100 p-5">
          <h2 className="font-semibold">Order status</h2>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </section>
        <section className="space-y-2 rounded-2xl border border-neutral-100 p-5 text-sm">
          <h2 className="font-semibold">Payment & email</h2>
          <p className="text-neutral-600">
            Razorpay order: <code className="text-xs">{order.razorpay_order_id ?? "—"}</code>
          </p>
          <p className="text-neutral-600">
            Payment ID: <code className="text-xs">{order.razorpay_payment_id ?? "—"}</code>
          </p>
          <p className="text-neutral-600">Paid at: {order.paid_at ? formatDateTime(order.paid_at) : "—"}</p>
          <p className="text-neutral-600">
            Confirmation emails sent: {order.email_send_count}
            {order.confirmation_email_sent_at && ` (last ${formatDateTime(order.confirmation_email_sent_at)})`}
          </p>
          {order.last_email_error && <Alert className="mt-2">Last email error: {order.last_email_error}</Alert>}
        </section>
      </div>

      <OrderDetails order={order} />
    </div>
  );
}
