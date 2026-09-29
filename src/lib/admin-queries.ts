import "server-only";
import { normalizeProduct, PRODUCT_SELECT } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

/** Admin reads (RLS lets admins see inactive products too). */
export async function getAllProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Product[]).map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeProduct(data as unknown as Product) : null;
}
