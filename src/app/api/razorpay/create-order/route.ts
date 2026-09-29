import { NextResponse } from "next/server";
import { z } from "zod";
import { orderTotals } from "@/lib/pricing";
import { getRazorpay } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { addressSchema, firstError } from "@/lib/validators";
import type { ShippingAddress } from "@/types";

const bodySchema = z.object({
  addressId: z.string().uuid().optional(),
  address: addressSchema.optional(),
  saveAddress: z.boolean().optional(),
});

interface CartRow {
  quantity: number;
  variant: {
    id: string;
    size: string;
    stock: number;
    product: {
      id: string;
      name: string;
      price_paise: number;
      is_active: boolean;
      images: { url: string; is_primary: boolean; sort_order: number }[];
    } | null;
  } | null;
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/**
 * Creates a pending order from the signed-in user's cart and a matching
 * Razorpay order. All prices are read from the database — never from the client.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to check out.", 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(firstError(parsed.error));
  const { addressId, address, saveAddress } = parsed.data;

  // 1. Resolve the shipping address.
  let shipping: ShippingAddress;
  if (addressId) {
    const { data } = await supabase
      .from("addresses")
      .select("full_name, phone, line1, line2, city, state, pincode")
      .eq("id", addressId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) return fail("Please choose a delivery address.");
    shipping = data as ShippingAddress;
  } else if (address) {
    shipping = address;
    if (saveAddress) {
      const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true });
      await supabase.from("addresses").insert({ ...address, user_id: user.id, is_default: !count });
    }
  } else {
    return fail("Please enter a delivery address.");
  }

  // 2. Load the cart with current prices and stock.
  const { data: cartData, error: cartError } = await supabase
    .from("cart_items")
    .select(
      "quantity, variant:product_variants(id, size, stock, " +
        "product:products(id, name, price_paise, is_active, images:product_images(url, is_primary, sort_order)))",
    )
    .eq("user_id", user.id);
  if (cartError) return fail("Could not load your cart. Please try again.", 500);

  const cart = (cartData ?? []) as unknown as CartRow[];
  if (!cart.length) return fail("Your cart is empty.");

  const lines = [];
  for (const row of cart) {
    const v = row.variant;
    const p = v?.product;
    if (!v || !p || !p.is_active) return fail("An item in your cart is no longer available. Please review your cart.");
    if (row.quantity > v.stock) {
      return fail(`Only ${v.stock} left of ${p.name} (UK ${v.size}). Please update your cart.`);
    }
    const image = [...p.images].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    )[0];
    lines.push({
      product_id: p.id,
      variant_id: v.id,
      product_name: p.name,
      size: v.size,
      unit_price_paise: p.price_paise,
      quantity: row.quantity,
      image_url: image?.url ?? null,
      pricePaise: p.price_paise,
    });
  }
  const { subtotal, shipping: shippingFee, total } = orderTotals(lines);

  // 3. Create the pending order (service role — customers cannot insert orders).
  let admin;
  let razorpay;
  try {
    admin = createAdminClient();
    razorpay = getRazorpay();
  } catch (e) {
    console.error(e);
    return fail("Payments are not set up yet. Please try again later.", 500);
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      customer_email: user.email,
      status: "pending",
      subtotal_paise: subtotal,
      shipping_paise: shippingFee,
      total_paise: total,
      shipping_address: shipping,
    })
    .select("id")
    .single();
  if (orderError || !order) return fail("Could not create your order. Please try again.", 500);

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product_id,
        variant_id: l.variant_id,
        product_name: l.product_name,
        size: l.size,
        unit_price_paise: l.unit_price_paise,
        quantity: l.quantity,
        image_url: l.image_url,
      })),
    );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return fail("Could not create your order. Please try again.", 500);
  }

  // 4. Create the Razorpay order for the exact server-computed amount.
  try {
    const rzpOrder = await razorpay.orders.create({
      amount: total,
      currency: "INR",
      receipt: order.id,
      notes: { order_id: order.id },
    });
    await admin.from("orders").update({ razorpay_order_id: rzpOrder.id }).eq("id", order.id);

    const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: shipping.full_name || profile?.full_name || "",
        email: user.email ?? "",
        contact: shipping.phone || profile?.phone || "",
      },
    });
  } catch (e) {
    console.error("Razorpay order creation failed", e);
    await admin.from("orders").delete().eq("id", order.id);
    return fail("Could not start the payment. Please try again.", 502);
  }
}
