import Link from "next/link";
import { PageHeader } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/Feedback";
import { formatDate, formatPrice, orderNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/types";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ count: productCount }, { data: orderRows }, { data: lowStock }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, status, total_paise, customer_email, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("product_variants")
      .select("size, stock, product:products(name, id)")
      .lte("stock", 2)
      .order("stock")
      .limit(8),
  ]);

  const orders = (orderRows ?? []) as Pick<Order, "id" | "status" | "total_paise" | "customer_email" | "created_at">[];
  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const revenue = orders
    .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
    .reduce((sum, o) => sum + o.total_paise, 0);
  const recent = orders.filter((o) => o.status !== "pending").slice(0, 6);

  const stats = [
    { label: "Revenue (paid orders)", value: formatPrice(revenue) },
    { label: "To ship", value: byStatus("paid") },
    { label: "Shipped", value: byStatus("shipped") },
    { label: "Products", value: productCount ?? 0 },
  ];

  const low = (lowStock ?? []) as unknown as { size: string; stock: number; product: { name: string; id: string } | null }[];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Overview of your store." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-100 p-5">
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-neutral-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-brand-600">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-500">No paid orders yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-3 py-3 text-sm hover:text-brand-600">
                    <span className="font-semibold">{orderNumber(o.id)}</span>
                    <StatusBadge status={o.status} />
                    <span className="min-w-0 flex-1 truncate text-neutral-500">{o.customer_email}</span>
                    <span className="text-neutral-500">{formatDate(o.created_at)}</span>
                    <span className="font-semibold">{formatPrice(o.total_paise)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-neutral-100 p-5">
          <h2 className="mb-4 font-semibold">Low stock (2 or fewer)</h2>
          {low.length === 0 ? (
            <p className="text-sm text-neutral-500">All sizes are well stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {low.map((v, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <Link href={`/admin/products/${v.product?.id}/edit`} className="truncate hover:text-brand-600">
                    {v.product?.name} · UK {v.size}
                  </Link>
                  <span className={v.stock === 0 ? "font-semibold text-brand-700" : "text-amber-700"}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
