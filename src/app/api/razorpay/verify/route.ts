import { NextResponse } from "next/server";
import { z } from "zod";
import { finalizePaidOrder } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

/** Called by the browser after Razorpay Checkout succeeds. Verifies the signature before marking the order paid. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    await finalizePaidOrder(order.id, razorpay_payment_id);
  } catch (e) {
    console.error(e);
    // The webhook will retry marking the order as paid.
    return NextResponse.json({ orderId: order.id, pending: true });
  }

  return NextResponse.json({ orderId: order.id });
}
