"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { formatPrice } from "@/lib/format";
import { MAX_QTY_PER_LINE, orderTotals } from "@/lib/pricing";
import type { CartLine } from "@/types";

/** Problems that block checkout for a line (inactive product, not enough stock). */
export function lineIssue(line: CartLine) {
  if (!line.isActive) return "This product is no longer available. Please remove it.";
  if (line.stock <= 0) return "This size is out of stock. Choose another size or remove it.";
  if (line.quantity > line.stock) return `Only ${line.stock} left in this size. Please reduce the quantity.`;
  return null;
}

function CartRow({ line }: { line: CartLine }) {
  const { setQuantity, remove, changeSize } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const issue = lineIssue(line);
  const maxQty = Math.min(MAX_QTY_PER_LINE, Math.max(line.stock, 1));

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError("");
    const res = await fn();
    if (!res.ok) setError(res.error ?? "Something went wrong.");
    setBusy(false);
  }

  return (
    <li className="flex gap-4 py-6">
      <Link
        href={line.slug ? `/product/${line.slug}` : "#"}
        className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-neutral-50 sm:size-28"
      >
        {line.image && (
          <Image src={line.image} alt={line.name} fill sizes="112px" className="object-contain p-2" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.slug}`} className="font-semibold hover:text-brand-600">
              {line.name}
            </Link>
            <p className="text-sm text-neutral-500">{formatPrice(line.pricePaise)} each</p>
          </div>
          <p className="shrink-0 font-semibold">{formatPrice(line.pricePaise * line.quantity)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500">Size</span>
            <select
              value={line.variantId}
              disabled={busy || !line.isActive}
              onChange={(e) => run(() => changeSize(line.variantId, e.target.value))}
              className="h-9 rounded-lg border border-neutral-200 bg-white px-2 text-sm focus:border-brand-600 focus:outline-none"
              aria-label={`Size for ${line.name}`}
            >
              {line.sizes.map((s) => (
                <option key={s.variantId} value={s.variantId} disabled={s.stock <= 0 && s.variantId !== line.variantId}>
                  UK {s.size}
                  {s.stock <= 0 ? " (sold out)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="flex h-9 items-center rounded-full border border-neutral-200">
            <button
              type="button"
              className="grid size-9 place-items-center disabled:opacity-30"
              disabled={busy || line.quantity <= 1}
              onClick={() => run(() => setQuantity(line.variantId, line.quantity - 1))}
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-7 text-center text-sm font-semibold">{line.quantity}</span>
            <button
              type="button"
              className="grid size-9 place-items-center disabled:opacity-30"
              disabled={busy || line.quantity >= maxQty}
              onClick={() => run(() => setQuantity(line.variantId, line.quantity + 1))}
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => remove(line.variantId))}
            className="ml-auto flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-600"
          >
            <Trash2 className="size-4" /> Remove
          </button>
        </div>
        {(issue || error) && <p className="text-sm text-brand-700">{error || issue}</p>}
      </div>
    </li>
  );
}

export function CartView() {
  const { lines, loading, isSignedIn } = useCart();

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!lines.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-12" />}
        title="Your cart is empty"
        description="Find something you love — sneakers, running shoes or boots."
        action={<ButtonLink href="/search">Start shopping</ButtonLink>}
      />
    );
  }

  const { subtotal, shipping, total } = orderTotals(lines);
  const blocked = lines.some((l) => lineIssue(l));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-neutral-100 border-y border-neutral-100">
        {lines.map((line) => (
          <CartRow key={line.variantId} line={line} />
        ))}
      </ul>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <OrderSummary subtotal={subtotal} shipping={shipping} total={total}>
          {blocked && <Alert>Please fix the items marked in your cart before checking out.</Alert>}
          {blocked ? (
            <span className="block rounded-full bg-neutral-200 py-3 text-center text-sm font-semibold text-neutral-500">
              Checkout
            </span>
          ) : (
            <ButtonLink href={isSignedIn ? "/checkout" : "/login?next=/checkout"} size="lg" className="w-full">
              {isSignedIn ? "Checkout" : "Log in to checkout"}
            </ButtonLink>
          )}
          {!isSignedIn && (
            <p className="text-center text-xs text-neutral-500">
              Your cart will be saved to your account when you log in.
            </p>
          )}
        </OrderSummary>
      </div>
    </div>
  );
}
