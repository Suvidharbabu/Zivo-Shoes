import "server-only";
import { Resend } from "resend";
import { orderConfirmationEmail } from "@/emails/order-confirmation";
import { getSiteUrl } from "@/lib/env";
import { ORDER_SELECT } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/types";

/**
 * Sends (or re-sends) the order confirmation email and records the result on
 * the order. Never throws — payment flows must not fail because of email.
 */
export async function sendOrderConfirmation(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data, error: loadError } = await admin.from("orders").select(ORDER_SELECT).eq("id", orderId).single();
  if (loadError || !data) return { ok: false, error: "Order not found." };
  const order = data as unknown as Order;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Zivo <onboarding@resend.dev>";

  let error: string | undefined;
  if (!apiKey) {
    error = "Email is not configured (RESEND_API_KEY is missing).";
  } else {
    try {
      const { subject, html, text } = orderConfirmationEmail(order, getSiteUrl());
      const result = await new Resend(apiKey).emails.send({
        from,
        to: order.customer_email,
        subject,
        html,
        text,
      });
      if (result.error) error = result.error.message;
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown email error";
    }
  }

  await admin
    .from("orders")
    .update(
      error
        ? { last_email_error: error.slice(0, 500) }
        : {
            confirmation_email_sent_at: new Date().toISOString(),
            email_send_count: (order.email_send_count ?? 0) + 1,
            last_email_error: null,
          },
    )
    .eq("id", orderId);

  if (error) console.error(`[email] order ${orderId}: ${error}`);
  return error ? { ok: false, error } : { ok: true };
}
