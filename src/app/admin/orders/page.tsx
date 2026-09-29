import Link from "next/link";
import { PageHeader } from "@/components/ui/Container";
import { EmptyState, StatusBadge } from "@/components/ui/Feedback";
import { cn, formatDateTime, formatPrice, orderNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/types";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const filter = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : null;

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, status, total_paise, customer_email, shipping_address, created_at, email_send_count, last_email_error")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter) query = query.eq("status", filter);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const orders = (data ?? []) as Order[];

  const tab = (active: boolean) =>
    cn(
      "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium capitalize",
      active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Pending orders are checkouts that were not (yet) paid." />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/orders" className={tab(!filter)}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={tab(filter === s)}>
            {s}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders here yet" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-600 hover:text-brand-700">
                      {orderNumber(o.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{o.shipping_address?.full_name}</p>
                    <p className="text-xs text-neutral-500">{o.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.last_email_error ? (
                      <span className="text-brand-700">Failed</span>
                    ) : o.email_send_count > 0 ? (
                      <span className="text-green-700">Sent ×{o.email_send_count}</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(o.total_paise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
