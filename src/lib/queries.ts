import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category, Order, Product } from "@/types";

export const PRODUCT_SELECT =
  "id, category_id, name, slug, description, price_paise, compare_at_paise, is_featured, is_active, created_at, " +
  "category:categories(name, slug), " +
  "images:product_images(id, product_id, url, storage_path, description, sort_order, is_primary), " +
  "variants:product_variants(id, product_id, size, stock)";

const SIZE_ORDER = (a: { size: string }, b: { size: string }) => Number(a.size) - Number(b.size);

/** Sort images (primary first, then sort_order) and variants (by size). */
export function normalizeProduct(p: Product): Product {
  return {
    ...p,
    images: [...(p.images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    ),
    variants: [...(p.variants ?? [])].sort(SIZE_ORDER),
  };
}

export type SortOption = "newest" | "price-asc" | "price-desc";

export interface ProductFilters {
  categorySlug?: string;
  q?: string;
  minPrice?: number; // rupees
  maxPrice?: number; // rupees
  sort?: SortOption;
  featured?: boolean;
  limit?: number;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, sort_order")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Category) ?? null;
}

/** Keep search text to safe characters (it is used in a PostgREST filter). */
function cleanSearch(q: string) {
  return q.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true);

  if (filters.categorySlug) {
    const category = await getCategoryBySlug(filters.categorySlug);
    if (!category) return [];
    query = query.eq("category_id", category.id);
  }
  if (filters.featured) query = query.eq("is_featured", true);

  const q = filters.q ? cleanSearch(filters.q) : "";
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

  if (filters.minPrice != null && filters.minPrice > 0) {
    query = query.gte("price_paise", Math.round(filters.minPrice * 100));
  }
  if (filters.maxPrice != null && filters.maxPrice > 0) {
    query = query.lte("price_paise", Math.round(filters.maxPrice * 100));
  }

  switch (filters.sort) {
    case "price-asc":
      query = query.order("price_paise", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price_paise", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Product[]).map(normalizeProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeProduct(data as unknown as Product) : null;
}

export const ORDER_SELECT =
  "id, user_id, customer_email, status, subtotal_paise, shipping_paise, total_paise, shipping_address, " +
  "razorpay_order_id, razorpay_payment_id, paid_at, confirmation_email_sent_at, email_send_count, " +
  "last_email_error, created_at, " +
  "items:order_items(id, product_id, variant_id, product_name, size, unit_price_paise, quantity, image_url)";

/** Reads an order through RLS: customers only get their own, admins get any. */
export async function getOrder(id: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as Order) ?? null;
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Order[];
}
