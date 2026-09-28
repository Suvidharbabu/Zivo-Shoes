/** UK sizes sold in the store. */
export const SIZES = ["6", "7", "8", "9", "10", "11"] as const;

export const MAX_QTY_PER_LINE = 10;

/** Free shipping at ₹999 or more, otherwise ₹99. Prices include GST. */
export const FREE_SHIPPING_THRESHOLD_PAISE = 99900;
export const SHIPPING_FEE_PAISE = 9900;

export function shippingFor(subtotalPaise: number) {
  if (subtotalPaise <= 0) return 0;
  return subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : SHIPPING_FEE_PAISE;
}

export function orderTotals(lines: { pricePaise: number; quantity: number }[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.pricePaise * l.quantity, 0);
  const shipping = shippingFor(subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}

export const LOW_STOCK_THRESHOLD = 3;
