"use server";

import { revalidatePath } from "next/cache";
import { getAdminOrNull } from "@/lib/auth";
import { SIZES } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { firstError, orderStatusSchema, productSchema, uuidSchema, type ProductInput } from "@/lib/validators";
import type { ActionResult } from "@/types";

const NOT_ADMIN = { ok: false as const, error: "You must be an admin to do this." };

function revalidateStore() {
  revalidatePath("/", "layout");
}

async function saveVariants(productId: string, stock: ProductInput["stock"]) {
  const supabase = await createClient();
  const rows = SIZES.map((size) => ({ product_id: productId, size, stock: stock[size] ?? 0 }));
  return supabase.from("product_variants").upsert(rows, { onConflict: "product_id,size" });
}

function toRow(p: ProductInput) {
  return {
    name: p.name,
    slug: p.slug,
    category_id: p.category_id,
    description: p.description,
    price_paise: Math.round(p.price * 100),
    compare_at_paise: p.compare_at_price == null ? null : Math.round(p.compare_at_price * 100),
    is_featured: p.is_featured,
    is_active: p.is_active,
  };
}

export async function createProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(toRow(parsed.data)).select("id").single();
  if (error) {
    return { ok: false, error: error.code === "23505" ? "That URL slug is already used by another product." : error.message };
  }
  const { error: vError } = await saveVariants(data.id, parsed.data.stock);
  if (vError) return { ok: false, error: `Product saved, but stock failed: ${vError.message}` };

  revalidateStore();
  return { ok: true, data: { id: data.id as string } };
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  if (!uuidSchema.safeParse(id).success) return { ok: false, error: "Invalid product." };
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(toRow(parsed.data)).eq("id", id);
  if (error) {
    return { ok: false, error: error.code === "23505" ? "That URL slug is already used by another product." : error.message };
  }
  const { error: vError } = await saveVariants(id, parsed.data.stock);
  if (vError) return { ok: false, error: vError.message };

  revalidateStore();
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  if (!uuidSchema.safeParse(id).success) return { ok: false, error: "Invalid product." };

  const supabase = await createClient();
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  const paths = (images ?? []).map((i) => i.storage_path as string | null).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("product-images").remove(paths);

  revalidateStore();
  return { ok: true };
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  if (!uuidSchema.safeParse(orderId).success) return { ok: false, error: "Invalid order." };
  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status: parsed.data }).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin", "layout");
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}
