"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminOrNull } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstError, uuidSchema } from "@/lib/validators";
import type { ActionResult } from "@/types";

/**
 * Product image management (admin only). Files are uploaded from the browser
 * straight to Supabase Storage (bucket rules + storage RLS enforce admin, type
 * and size); these actions record/update the product_images rows.
 */

const BUCKET = "product-images";
const NOT_ADMIN = { ok: false as const, error: "You must be an admin to do this." };

// Paths look like "<productId>/<random>.<ext>" — never trust a full URL from the client.
const storagePathSchema = z
  .string()
  .regex(/^[0-9a-f-]{36}\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|avif)$/, "Invalid file path");

const descriptionSchema = z.string().trim().max(300, "Keep the description under 300 characters");

function refresh(productId: string) {
  revalidatePath(`/admin/products/${productId}/images`);
  revalidatePath("/admin/images");
  revalidatePath("/", "layout");
}

async function publicUrl(path: string) {
  const supabase = await createClient();
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function getImage(imageId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path, is_primary, sort_order")
    .eq("id", imageId)
    .maybeSingle();
  return data as { id: string; product_id: string; storage_path: string | null; is_primary: boolean; sort_order: number } | null;
}

export async function addProductImage(
  productId: string,
  storagePath: string,
  description: string,
): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  const input = z
    .object({ productId: uuidSchema, storagePath: storagePathSchema, description: descriptionSchema })
    .safeParse({ productId, storagePath, description });
  if (!input.success) return { ok: false, error: firstError(input.error) };
  if (!storagePath.startsWith(`${productId}/`)) return { ok: false, error: "File does not belong to this product." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order, is_primary")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false });
  const rows = existing ?? [];

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    url: await publicUrl(storagePath),
    storage_path: storagePath,
    description: input.data.description,
    sort_order: rows.length ? (rows[0].sort_order as number) + 1 : 0,
    is_primary: !rows.some((r) => r.is_primary),
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: error.message };
  }

  refresh(productId);
  return { ok: true };
}

export async function replaceProductImage(imageId: string, newStoragePath: string): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  if (!uuidSchema.safeParse(imageId).success) return { ok: false, error: "Invalid image." };
  const path = storagePathSchema.safeParse(newStoragePath);
  if (!path.success) return { ok: false, error: firstError(path.error) };

  const image = await getImage(imageId);
  if (!image) return { ok: false, error: "Image not found." };
  if (!newStoragePath.startsWith(`${image.product_id}/`)) return { ok: false, error: "File does not belong to this product." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_images")
    .update({ url: await publicUrl(newStoragePath), storage_path: newStoragePath })
    .eq("id", imageId);
  if (error) return { ok: false, error: error.message };

  if (image.storage_path) await supabase.storage.from(BUCKET).remove([image.storage_path]);
  refresh(image.product_id);
  return { ok: true };
}

export async function updateImageDescription(imageId: string, description: string): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  if (!uuidSchema.safeParse(imageId).success) return { ok: false, error: "Invalid image." };
  const parsed = descriptionSchema.safeParse(description);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_images")
    .update({ description: parsed.data })
    .eq("id", imageId)
    .select("product_id")
    .single();
  if (error) return { ok: false, error: error.message };

  refresh(data.product_id as string);
  return { ok: true };
}

export async function setPrimaryImage(imageId: string): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  if (!uuidSchema.safeParse(imageId).success) return { ok: false, error: "Invalid image." };
  const image = await getImage(imageId);
  if (!image) return { ok: false, error: "Image not found." };

  const supabase = await createClient();
  // Unset first: a unique index allows only one primary image per product.
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", image.product_id);
  const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);
  if (error) return { ok: false, error: error.message };

  refresh(image.product_id);
  return { ok: true };
}

export async function moveImage(imageId: string, direction: "up" | "down"): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  if (!uuidSchema.safeParse(imageId).success) return { ok: false, error: "Invalid image." };
  const image = await getImage(imageId);
  if (!image) return { ok: false, error: "Image not found." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .eq("product_id", image.product_id)
    .order("sort_order")
    .order("created_at");
  const list = (data ?? []) as { id: string; sort_order: number }[];
  const index = list.findIndex((i) => i.id === imageId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= list.length) return { ok: true };

  // Renumber everything so duplicate sort_order values can't get stuck.
  const reordered = [...list];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
  for (const [i, item] of reordered.entries()) {
    if (item.sort_order !== i) {
      const { error } = await supabase.from("product_images").update({ sort_order: i }).eq("id", item.id);
      if (error) return { ok: false, error: error.message };
    }
  }

  refresh(image.product_id);
  return { ok: true };
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  if (!(await getAdminOrNull())) return NOT_ADMIN;
  if (!uuidSchema.safeParse(imageId).success) return { ok: false, error: "Invalid image." };
  const image = await getImage(imageId);
  if (!image) return { ok: false, error: "Image not found." };

  const supabase = await createClient();
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: error.message };
  if (image.storage_path) await supabase.storage.from(BUCKET).remove([image.storage_path]);

  // Keep a primary image if any images remain.
  if (image.is_primary) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", image.product_id)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (next) await supabase.from("product_images").update({ is_primary: true }).eq("id", next.id);
  }

  refresh(image.product_id);
  return { ok: true };
}
