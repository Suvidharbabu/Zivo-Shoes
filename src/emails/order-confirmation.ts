import { formatDate, formatPrice, orderNumber } from "@/lib/format";
import type { Order } from "@/types";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absolute(url: string | null, siteUrl: string) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${siteUrl}${url}`;
}

/** Plain HTML email (inline styles, table layout) that renders well in Gmail and Outlook. */
export function orderConfirmationEmail(order: Order, siteUrl: string) {
  const number = orderNumber(order.id);
  const a = order.shipping_address;
  const items = order.items ?? [];

  const rows = items
    .map((item) => {
      const img = absolute(item.image_url, siteUrl);
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;width:72px;vertical-align:top;">
          ${img ? `<img src="${esc(img)}" width="64" height="64" alt="" style="display:block;border-radius:8px;background:#fafafa;object-fit:contain;" />` : ""}
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;vertical-align:top;font-size:14px;color:#171717;">
          <strong>${esc(item.product_name)}</strong><br />
          <span style="color:#737373;">UK ${esc(item.size)} &middot; Qty ${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;text-align:right;font-size:14px;color:#171717;white-space:nowrap;">
          ${formatPrice(item.unit_price_paise * item.quantity)}
        </td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#dc2626;padding:24px 28px;">
            <span style="font-size:26px;font-weight:900;color:#ffffff;">Zivo.</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 8px;font-size:22px;color:#171717;">Thanks for your order!</h1>
            <p style="margin:0 0 20px;font-size:14px;color:#525252;line-height:1.6;">
              Hi ${esc(a.full_name)}, we've received your payment and your order is being prepared.
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#171717;">
              <strong>Order:</strong> ${number}<br />
              <strong>Date:</strong> ${formatDate(order.paid_at ?? order.created_at)}
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:14px;color:#171717;">
              <tr><td style="padding:4px 0;color:#525252;">Subtotal</td><td style="text-align:right;">${formatPrice(order.subtotal_paise)}</td></tr>
              <tr><td style="padding:4px 0;color:#525252;">Shipping</td><td style="text-align:right;">${order.shipping_paise ? formatPrice(order.shipping_paise) : "Free"}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold;border-top:1px solid #e5e5e5;">Total paid</td><td style="text-align:right;font-weight:bold;border-top:1px solid #e5e5e5;">${formatPrice(order.total_paise)}</td></tr>
            </table>
            <h2 style="margin:24px 0 8px;font-size:15px;color:#171717;">Shipping to</h2>
            <p style="margin:0;font-size:14px;color:#525252;line-height:1.6;">
              ${esc(a.full_name)}<br />
              ${esc(a.line1)}${a.line2 ? `, ${esc(a.line2)}` : ""}<br />
              ${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)}<br />
              Phone: ${esc(a.phone)}
            </p>
            <p style="margin:28px 0 0;">
              <a href="${esc(`${siteUrl}/account/orders/${order.id}`)}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:999px;">View your order</a>
            </p>
          </td></tr>
          <tr><td style="padding:18px 28px;background:#fafafa;font-size:12px;color:#a3a3a3;">
            You're receiving this email because you placed an order at Zivo. Prices include GST.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    `Thanks for your order! (${number})`,
    "",
    ...items.map((i) => `${i.product_name} — UK ${i.size} × ${i.quantity}: ${formatPrice(i.unit_price_paise * i.quantity)}`),
    "",
    `Subtotal: ${formatPrice(order.subtotal_paise)}`,
    `Shipping: ${order.shipping_paise ? formatPrice(order.shipping_paise) : "Free"}`,
    `Total paid: ${formatPrice(order.total_paise)}`,
    "",
    `View your order: ${siteUrl}/account/orders/${order.id}`,
  ].join("\n");

  return { subject: `Your Zivo order ${number} is confirmed`, html, text };
}
