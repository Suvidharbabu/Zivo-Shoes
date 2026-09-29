import Image from "next/image";
import { AddressText } from "@/components/account/AddressList";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { StatusBadge } from "@/components/ui/Feedback";
import { formatDateTime, formatPrice, orderNumber } from "@/lib/format";
import type { Order } from "@/types";
import { ResendEmailButton } from "./ResendEmailButton";

export function OrderDetails({ order, showResend = true }: { order: Order; showResend?: boolean }) {
  const canResend = showResend && order.status !== "pending" && order.status !== "cancelled";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Order {orderNumber(order.id)}</h2>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm text-neutral-500">Placed {formatDateTime(order.created_at)}</p>

        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                {item.image_url && (
                  <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-contain p-1" />
                )}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-neutral-500">
                  UK {item.size} · Qty {item.quantity} · {formatPrice(item.unit_price_paise)} each
                </p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(item.unit_price_paise * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-100 p-5">
            <h3 className="mb-3 text-sm font-semibold">Delivery address</h3>
            <AddressText address={order.shipping_address} />
          </div>
          <div className="space-y-3 rounded-2xl border border-neutral-100 p-5 text-sm">
            <h3 className="font-semibold">Confirmation email</h3>
            <p className="text-neutral-600">
              {order.confirmation_email_sent_at
                ? `Sent to ${order.customer_email} on ${formatDateTime(order.confirmation_email_sent_at)}.`
                : order.status === "pending"
                  ? "Will be sent once payment is confirmed."
                  : `Not sent yet to ${order.customer_email}.`}
            </p>
            {canResend && (
              <ResendEmailButton
                orderId={order.id}
                lastSentAt={order.confirmation_email_sent_at}
                email={order.customer_email}
              />
            )}
          </div>
        </div>
      </div>
      <div className="lg:self-start">
        <OrderSummary
          subtotal={order.subtotal_paise}
          shipping={order.shipping_paise}
          total={order.total_paise}
          showFreeShippingHint={false}
        />
      </div>
    </div>
  );
}
