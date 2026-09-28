"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export function CartIcon() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative grid size-10 place-items-center rounded-full text-neutral-800 hover:bg-neutral-100"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold leading-5 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
