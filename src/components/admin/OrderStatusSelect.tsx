"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/actions/admin-products";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { ORDER_STATUSES, type OrderStatus } from "@/types";

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(status);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={value}
          onChange={(e) => setValue(e.target.value as OrderStatus)}
          aria-label="Order status"
          className="capitalize"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </Select>
        <Button
          size="md"
          disabled={value === status}
          loading={pending}
          onClick={() => {
            if (value === "cancelled" && !confirm("Mark this order as cancelled? Refunds must be issued from the Razorpay dashboard.")) return;
            setMessage(null);
            startTransition(async () => {
              const res = await updateOrderStatus(orderId, value);
              setMessage(res.ok ? { ok: true, text: "Status updated." } : { ok: false, text: res.error });
              router.refresh();
            });
          }}
        >
          Update
        </Button>
      </div>
      {message && <p className={message.ok ? "text-sm text-green-700" : "text-sm text-brand-700"}>{message.text}</p>}
    </div>
  );
}
