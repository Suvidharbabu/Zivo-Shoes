import "server-only";
import { after } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Marks an order as paid (idempotent, via the mark_order_paid SQL function).
 * Only the call that actually flips the order to "paid" schedules the
 * confirmation email, so the verify route and the webhook never double-send.
 */
export async function finalizePaidOrder(orderId: string, paymentId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_payment_id: paymentId,
  });
  if (error) throw new Error(`mark_order_paid failed: ${error.message}`);

  const changed = data === true;
  if (changed) {
    // Send after the response so the customer isn't kept waiting.
    after(async () => {
      await sendOrderConfirmation(orderId);
    });
  }
  return changed;
}
