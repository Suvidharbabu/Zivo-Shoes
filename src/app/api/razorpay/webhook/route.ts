import { NextResponse } from "next/server";
import { finalizePaidOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

interface RazorpayEvent {
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string | null; amount: number; status: string } };
    order?: { entity: { id: string; amount: number } };
  };
}

/**
 * Razorpay webhook — backup confirmation in case the browser never calls
 * /api/razorpay/verify (closed tab, lost connection…). Subscribe to
 * "payment.captured" and "order.paid" in the Razorpay dashboard.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "payment.failed") {
    const p = event.payload.payment?.entity;
    console.warn(`[razorpay] payment failed for order ${p?.order_id} (payment ${p?.id})`);
    return NextResponse.json({ received: true });
  }

  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload.payment?.entity;
  const razorpayOrderId = payment?.order_id ?? event.payload.order?.entity.id;
  if (!payment || !razorpayOrderId) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, total_paise")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ received: true });

  if (payment.amount !== order.total_paise) {
    console.error(`[razorpay] amount mismatch for order ${order.id}: paid ${payment.amount}, expected ${order.total_paise}`);
    return NextResponse.json({ received: true });
  }

  try {
    await finalizePaidOrder(order.id, payment.id);
  } catch (e) {
    console.error(e);
    // Non-2xx makes Razorpay retry the webhook later.
    return NextResponse.json({ error: "Could not update order" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
