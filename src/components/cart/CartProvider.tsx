"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import type { CartLine } from "@/types";

/** Guest carts live in localStorage; signed-in carts live in the cart_items table (RLS protected). */
const STORAGE_KEY = "zivo-cart-v1";

interface StoredLine {
  variantId: string;
  quantity: number;
}

type Result = { ok: true } | { ok: false; error: string };

interface CartContextValue {
  lines: CartLine[];
  count: number;
  loading: boolean;
  isSignedIn: boolean;
  add: (variantId: string, quantity: number, stock: number) => Promise<Result>;
  setQuantity: (variantId: string, quantity: number) => Promise<Result>;
  remove: (variantId: string) => Promise<Result>;
  changeSize: (fromVariantId: string, toVariantId: string) => Promise<Result>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function readLocal(): StoredLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredLine[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter((l) => typeof l.variantId === "string" && Number.isInteger(l.quantity) && l.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

function writeLocal(lines: StoredLine[]) {
  try {
    if (lines.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode) — the cart simply won't persist.
  }
}

interface CartRow {
  variant_id: string;
  quantity: number;
}

interface VariantRow {
  id: string;
  size: string;
  stock: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price_paise: number;
    is_active: boolean;
    images: { url: string; is_primary: boolean; sort_order: number }[];
    variants: { id: string; size: string; stock: number }[];
  } | null;
}

async function resolveLines(stored: StoredLine[]): Promise<CartLine[]> {
  if (!stored.length) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      "id, size, stock, product:products(id, name, slug, price_paise, is_active, " +
        "images:product_images(url, is_primary, sort_order), variants:product_variants(id, size, stock))",
    )
    .in(
      "id",
      stored.map((l) => l.variantId),
    );
  if (error) throw new Error(error.message);

  const byId = new Map(((data ?? []) as unknown as VariantRow[]).map((v) => [v.id, v]));
  return stored.flatMap((line) => {
    const v = byId.get(line.variantId);
    if (!v) return [];
    const p = v.product;
    const image = p
      ? [...p.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0]
      : undefined;
    return [
      {
        variantId: v.id,
        quantity: line.quantity,
        size: v.size,
        stock: v.stock,
        productId: p?.id ?? "",
        slug: p?.slug ?? "",
        name: p?.name ?? "Unavailable product",
        pricePaise: p?.price_paise ?? 0,
        image: image?.url ?? null,
        isActive: Boolean(p?.is_active),
        sizes: (p?.variants ?? [])
          .map((s) => ({ variantId: s.id, size: s.size, stock: s.stock }))
          .sort((a, b) => Number(a.size) - Number(b.size)),
      },
    ];
  });
}

export function CartProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const storedRef = useRef<StoredLine[]>([]);

  const commit = useCallback(async (next: StoredLine[]) => {
    storedRef.current = next;
    let resolved: CartLine[] | null = null;
    try {
      resolved = await resolveLines(next);
    } catch {
      // Keep the previous details if the lookup fails; counts still update.
    }
    setStored(next);
    if (resolved) setLines(resolved);
  }, []);

  /** Load the cart (and merge any guest cart into the account on sign-in). */
  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      if (userId) {
        const supabase = createClient();
        const guest = readLocal();
        if (guest.length) {
          const { data: existing } = await supabase
            .from("cart_items")
            .select("variant_id, quantity")
            .eq("user_id", userId);
          const current = new Map(((existing ?? []) as CartRow[]).map((r) => [r.variant_id, r.quantity]));
          const merged = guest.map((g) => ({
            user_id: userId,
            variant_id: g.variantId,
            quantity: Math.min(MAX_QTY_PER_LINE, (current.get(g.variantId) ?? 0) + g.quantity),
          }));
          const { error } = await supabase.from("cart_items").upsert(merged, { onConflict: "user_id,variant_id" });
          if (!error) writeLocal([]);
        }
        const { data } = await supabase
          .from("cart_items")
          .select("variant_id, quantity")
          .eq("user_id", userId)
          .order("created_at");
        await commit(((data ?? []) as CartRow[]).map((r) => ({ variantId: r.variant_id, quantity: r.quantity })));
      } else {
        await commit(readLocal());
      }
    } finally {
      setLoading(false);
    }
  }, [userId, commit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persist = useCallback(
    async (next: StoredLine[], changed: StoredLine[], removed: string[]): Promise<Result> => {
      if (userId) {
        const supabase = createClient();
        if (removed.length) {
          const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).in("variant_id", removed);
          if (error) return { ok: false, error: "Could not update your cart. Please try again." };
        }
        if (changed.length) {
          const { error } = await supabase.from("cart_items").upsert(
            changed.map((c) => ({ user_id: userId, variant_id: c.variantId, quantity: c.quantity })),
            { onConflict: "user_id,variant_id" },
          );
          if (error) return { ok: false, error: "Could not update your cart. Please try again." };
        }
      } else {
        writeLocal(next);
      }
      await commit(next);
      return { ok: true };
    },
    [userId, commit],
  );

  const add = useCallback(
    async (variantId: string, quantity: number, stock: number): Promise<Result> => {
      const current = storedRef.current;
      const existing = current.find((l) => l.variantId === variantId);
      const max = Math.min(MAX_QTY_PER_LINE, stock);
      const newQty = Math.min(max, (existing?.quantity ?? 0) + quantity);
      if (newQty <= 0) return { ok: false, error: "This size is out of stock." };
      if (existing && existing.quantity >= max) {
        return { ok: false, error: `You already have the maximum (${max}) of this size in your cart.` };
      }
      const line = { variantId, quantity: newQty };
      const next = existing ? current.map((l) => (l.variantId === variantId ? line : l)) : [...current, line];
      return persist(next, [line], []);
    },
    [persist],
  );

  const setQuantity = useCallback(
    async (variantId: string, quantity: number): Promise<Result> => {
      const current = storedRef.current;
      if (quantity <= 0) return persist(current.filter((l) => l.variantId !== variantId), [], [variantId]);
      const line = { variantId, quantity: Math.min(MAX_QTY_PER_LINE, quantity) };
      return persist(current.map((l) => (l.variantId === variantId ? line : l)), [line], []);
    },
    [persist],
  );

  const remove = useCallback(
    (variantId: string) => persist(storedRef.current.filter((l) => l.variantId !== variantId), [], [variantId]),
    [persist],
  );

  const changeSize = useCallback(
    async (fromVariantId: string, toVariantId: string): Promise<Result> => {
      if (fromVariantId === toVariantId) return { ok: true };
      const current = storedRef.current;
      const from = current.find((l) => l.variantId === fromVariantId);
      if (!from) return { ok: false, error: "Item not found in cart." };
      const target = current.find((l) => l.variantId === toVariantId);
      const merged = { variantId: toVariantId, quantity: Math.min(MAX_QTY_PER_LINE, from.quantity + (target?.quantity ?? 0)) };
      const next = current
        .filter((l) => l.variantId !== toVariantId)
        .map((l) => (l.variantId === fromVariantId ? merged : l));
      return persist(next, [merged], [fromVariantId]);
    },
    [persist],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: stored.reduce((sum, l) => sum + l.quantity, 0),
      loading,
      isSignedIn: Boolean(userId),
      add,
      setQuantity,
      remove,
      changeSize,
      refresh,
    }),
    [lines, stored, loading, userId, add, setQuantity, remove, changeSize, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
