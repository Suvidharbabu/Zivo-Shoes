/** Store categories shown in the header and footer (slugs match supabase/seed.sql). */
export const CATEGORY_LINKS = [
  { name: "Sneakers", href: "/category/sneakers" },
  { name: "Running Shoes", href: "/category/running-shoes" },
  { name: "Boots", href: "/category/boots" },
] as const;

/** Only allow same-site relative redirects (prevents open redirects via ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
