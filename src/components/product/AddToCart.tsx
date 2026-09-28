"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { cn } from "@/lib/format";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";
import { stockState } from "@/lib/product";
import type { ProductVariant } from "@/types";

export function AddToCart({ variants }: { variants: ProductVariant[] }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<{ type: "ok" | "error"; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  const selected = variants.find((v) => v.id === variantId) ?? null;
  const allSoldOut = variants.every((v) => v.stock <= 0);
  const maxQty = selected ? Math.min(MAX_QTY_PER_LINE, selected.stock) : MAX_QTY_PER_LINE;

  async function handleAdd() {
    if (!selected) {
      setStatus({ type: "error", message: "Please select a size." });
      return;
    }
    setPending(true);
    setStatus(null);
    const result = await add(selected.id, quantity, selected.stock);
    setPending(false);
    setStatus(
      result.ok
        ? { type: "ok", message: `Added to cart — UK ${selected.size} × ${quantity}` }
        : { type: "error", message: result.error },
    );
  }

  const state = selected ? stockState(selected.stock) : null;

  return (
    <div className="space-y-6">
      <fieldset>
        <div className="mb-3 flex items-center justify-between">
          <legend className="text-sm font-semibold text-neutral-900">Select size (UK)</legend>
          {selected && (
            <span
              className={cn(
                "text-xs font-medium",
                state === "out" && "text-neutral-500",
                state === "low" && "text-amber-700",
                state === "in" && "text-green-700",
              )}
            >
              {state === "out" ? "Out of stock" : state === "low" ? `Only ${selected.stock} left` : "In stock"}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {variants.map((v) => {
            const out = v.stock <= 0;
            const isSelected = v.id === variantId;
            return (
              <button
                key={v.id}
                type="button"
                disabled={out}
                onClick={() => {
                  setVariantId(v.id);
                  setQuantity(1);
                  setStatus(null);
                }}
                aria-pressed={isSelected}
                aria-label={`UK ${v.size}${out ? ", out of stock" : ""}`}
                className={cn(
                  "h-12 rounded-lg border text-sm font-medium transition-colors",
                  isSelected
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-900",
                  out && "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300 line-through hover:border-neutral-100",
                )}
              >
                {v.size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-12 items-center rounded-full border border-neutral-200">
          <button
            type="button"
            className="grid size-12 place-items-center text-neutral-600 disabled:opacity-30"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="grid size-12 place-items-center text-neutral-600 disabled:opacity-30"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button size="lg" className="flex-1" onClick={handleAdd} loading={pending} disabled={allSoldOut}>
          {allSoldOut ? "Sold out" : "Add to cart"}
        </Button>
      </div>

      {status?.type === "ok" && (
        <Alert tone="green" className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Check className="size-4" /> {status.message}
          </span>
          <Link href="/cart" className="font-semibold underline">
            View cart
          </Link>
        </Alert>
      )}
      {status?.type === "error" && <Alert>{status.message}</Alert>}
    </div>
  );
}
