import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/pricing";

export function OrderSummary({
  subtotal,
  shipping,
  total,
  children,
  showFreeShippingHint = true,
}: {
  subtotal: number;
  shipping: number;
  total: number;
  children?: ReactNode;
  showFreeShippingHint?: boolean;
}) {
  const remaining = FREE_SHIPPING_THRESHOLD_PAISE - subtotal;

  return (
    <div className="space-y-4 rounded-2xl bg-neutral-50 p-6">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-600">Subtotal</dt>
          <dd className="font-medium">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600">Shipping</dt>
          <dd className="font-medium">{shipping === 0 ? <span className="text-green-700">Free</span> : formatPrice(shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-bold">{formatPrice(total)}</dd>
        </div>
      </dl>
      <p className="text-xs text-neutral-500">Prices include GST.</p>
      {showFreeShippingHint && subtotal > 0 && remaining > 0 && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
          Add {formatPrice(remaining)} more for free shipping.
        </p>
      )}
      {children}
    </div>
  );
}
