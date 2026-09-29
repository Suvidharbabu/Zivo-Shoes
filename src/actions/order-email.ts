"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validators";
import type { ActionResult } from "@/types";

const RESEND_COOLDOWN_SECONDS = 60;
const CUSTOMER_MAX_SENDS = 5;

/** Re-send the order confirmation email. Customers: own orders only; admins: any order. */
export async function resendOrderEmail(orderId: string): Promise<ActionResult<{ retryAfter?: number }>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please log in again." };
  if (!uuidSchema.safeParse(orderId).success) return { ok: false, error: "Order not found." };

  // Read through RLS: returns the order only if it belongs to the user (or the user is an admin).
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, status, confirmation_email_sent_at, email_send_count")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || (!user.isAdmin && order.user_id !== user.id)) return { ok: false, error: "Order not found." };

  if (order.status === "pending" || order.status === "cancelled") {
    return { ok: false, error: "A confirmation email can only be sent for paid orders." };
  }

  if (order.confirmation_email_sent_at) {
    const elapsed = (Date.now() - new Date(order.confirmation_email_sent_at).getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      return { ok: false, error: `Please wait ${wait}s before sending again.` };
    }
  }

  if (!user.isAdmin && order.email_send_count >= CUSTOMER_MAX_SENDS) {
    return { ok: false, error: "This email has already been sent several times. Please contact support if you still can't find it." };
  }

  const result = await sendOrderConfirmation(order.id);
  revalidatePath(`/admin/orders/${order.id}`);
  if (!result.ok) {
    return { ok: false, error: user.isAdmin ? `Email failed: ${result.error}` : "We couldn't send the email right now. Please try again later." };
  }
  return { ok: true };
}
