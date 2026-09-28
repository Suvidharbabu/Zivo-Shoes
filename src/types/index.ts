export type UserRole = "customer" | "admin";
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  phone: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  storage_path: string | null;
  description: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price_paise: number;
  compare_at_paise: number | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  category: Pick<Category, "name" | "slug"> | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Address {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export type ShippingAddress = Omit<Address, "id" | "is_default">;

export interface OrderItem {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  size: string;
  unit_price_paise: number;
  quantity: number;
  image_url: string | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_email: string;
  status: OrderStatus;
  subtotal_paise: number;
  shipping_paise: number;
  total_paise: number;
  shipping_address: ShippingAddress;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  paid_at: string | null;
  confirmation_email_sent_at: string | null;
  email_send_count: number;
  last_email_error: string | null;
  created_at: string;
  items?: OrderItem[];
}

/** A resolved cart line, used by the cart UI and checkout. */
export interface CartLine {
  variantId: string;
  quantity: number;
  size: string;
  stock: number;
  productId: string;
  slug: string;
  name: string;
  pricePaise: number;
  image: string | null;
  isActive: boolean;
  sizes: { variantId: string; size: string; stock: number }[];
}

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
