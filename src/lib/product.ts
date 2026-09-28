import { LOW_STOCK_THRESHOLD } from "@/lib/pricing";
import type { Product } from "@/types";

export function primaryImage(product: Pick<Product, "images">) {
  return product.images[0] ?? null;
}

export function totalStock(product: Pick<Product, "variants">) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export type StockState = "in" | "low" | "out";

export function stockState(stock: number): StockState {
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "in";
}
