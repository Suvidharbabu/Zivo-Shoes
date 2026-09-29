"use client";

import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Lock, ShoppingBag } from "lucide-react";
import { AddressText } from "@/components/account/AddressList";
import { useCart } from "@/components/cart/CartProvider";
import { lineIssue } from "@/components/cart/CartView";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Input";
import { cn, formatPrice } from "@/lib/format";
import { orderTotals } from "@/lib/pricing";
import type { Address } from "@/types";

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (resp: { error: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const ADDRESS_FIELDS = [
  { name: "full_name", label: "Full name", autoComplete: "name", span: 2 },
  { name: "phone", label: "Mobile number", autoComplete: "tel", type: "tel", span: 2 },
  { name: "line1", label: "House no., building, street", autoComplete: "address-line1", span: 2 },
  { name: "line2", label: "Area, landmark (optional)", autoComplete: "address-line2", span: 2, optional: true },
  { name: "city", label: "City", autoComplete: "address-level2", span: 1 },
  { name: "state", label: "State", autoComplete: "address-level1", span: 1 },
  { name: "pincode", label: "PIN code", autoComplete: "postal-code", inputMode: "numeric" as const, span: 1 },
];

export function CheckoutForm({ addresses, defaultName, defaultPhone }: { addresses: Address[]; defaultName: string; defaultPhone: string }) {
  const router = useRouter();
  const { lines, loading, refresh } = useCart();
  const [selected, setSelected] = useState<string>(addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "new");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);

  if (loading) return <Skeleton className="h-96 w-full" />;

  if (!lines.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-12" />}
        title="Your cart is empty"
        description="Add some shoes to your cart before checking out."
        action={<ButtonLink href="/search">Browse shoes</ButtonLink>}
      />
    );
  }

  const { subtotal, shipping, total } = orderTotals(lines);
  const blocked = lines.some((l) => lineIssue(l));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!window.Razorpay) {
      setError("The payment window is still loading. Please try again in a moment.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const body =
      selected === "new"
        ? {
            address: Object.fromEntries(ADDRESS_FIELDS.map((f) => [f.name, String(form.get(f.name) ?? "")])),
            saveAddress: form.get("save") === "on",
          }
        : { addressId: selected };

    setPending(true);
    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: "Something went wrong." }));
    if (!res.ok) {
      setPending(false);
      setError(data.error ?? "Could not start the payment.");
      return;
    }

    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: "Zivo",
      description: "Shoe order",
      prefill: data.prefill,
      theme: { color: "#dc2626" },
      handler: async (resp: RazorpaySuccess) => {
        const verify = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resp),
        });
        const result = await verify.json().catch(() => ({}));
        await refresh();
        if (verify.ok) {
          router.push(`/order/${result.orderId ?? data.orderId}`);
        } else {
          // Money may have been taken — the webhook will confirm it. Show the order page.
          router.push(`/order/${data.orderId}`);
        }
      },
      modal: {
        ondismiss: () => {
          setPending(false);
          setError("Payment was cancelled. You can try again whenever you're ready.");
        },
      },
    });
    rzp.on("payment.failed", (resp) => {
      setPending(false);
      setError(resp.error?.description ?? "Payment failed. Please try again.");
    });
    rzp.open();
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setScriptReady(true)} />
      <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Delivery address</h2>

          {addresses.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-4",
                    selected === a.id ? "border-brand-600 ring-2 ring-brand-100" : "border-neutral-200 hover:border-neutral-400",
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    value={a.id}
                    checked={selected === a.id}
                    onChange={() => setSelected(a.id)}
                    className="mt-1 accent-brand-600"
                  />
                  <AddressText address={a} />
                </label>
              ))}
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold",
                  selected === "new" ? "border-brand-600 ring-2 ring-brand-100" : "border-neutral-200 hover:border-neutral-400",
                )}
              >
                <input
                  type="radio"
                  name="address"
                  value="new"
                  checked={selected === "new"}
                  onChange={() => setSelected("new")}
                  className="accent-brand-600"
                />
                Use a new address
              </label>
            </div>
          )}

          {selected === "new" && (
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-neutral-100 p-5">
              {ADDRESS_FIELDS.map((f) => (
                <Field key={f.name} label={f.label} htmlFor={f.name} className={f.span === 2 ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                  <Input
                    id={f.name}
                    name={f.name}
                    type={f.type ?? "text"}
                    autoComplete={f.autoComplete}
                    inputMode={f.inputMode}
                    required={!f.optional}
                    defaultValue={f.name === "full_name" ? defaultName : f.name === "phone" ? defaultPhone : undefined}
                  />
                </Field>
              ))}
              <label className="col-span-2 flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" name="save" defaultChecked className="size-4 accent-brand-600" />
                Save this address for next time
              </label>
            </div>
          )}

          <h2 className="pt-4 text-xl font-semibold">Items</h2>
          <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
            {lines.map((l) => (
              <li key={l.variantId} className="flex items-center gap-4 p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                  {l.image && <Image src={l.image} alt={l.name} fill sizes="64px" className="object-contain p-1" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-neutral-500">
                    UK {l.size} · Qty {l.quantity}
                  </p>
                  {lineIssue(l) && <p className="text-brand-700">{lineIssue(l)}</p>}
                </div>
                <p className="text-sm font-semibold">{formatPrice(l.pricePaise * l.quantity)}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary subtotal={subtotal} shipping={shipping} total={total} showFreeShippingHint={false}>
            {error && <Alert>{error}</Alert>}
            {blocked && <Alert>Some items need attention. Please go back to your cart.</Alert>}
            <Button type="submit" size="lg" className="w-full" loading={pending} disabled={blocked || !scriptReady}>
              <Lock className="size-4" /> Pay {formatPrice(total)}
            </Button>
            <p className="text-center text-xs text-neutral-500">
              Secure payment by Razorpay — cards, UPI, netbanking and wallets.
            </p>
          </OrderSummary>
        </div>
      </form>
    </>
  );
}
