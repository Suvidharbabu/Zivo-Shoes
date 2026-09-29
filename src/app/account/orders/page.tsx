import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, PageHeader } from "@/components/ui/Container";
import { EmptyState, StatusBadge } from "@/components/ui/Feedback";
import { requireUser } from "@/lib/auth";
import { formatDate, formatPrice, orderNumber } from "@/lib/format";
import { getMyOrders } from "@/lib/queries";

export const metadata: Metadata = { title: "My orders" };

export default async function MyOrdersPage() {
  const user = await requireUser("/account/orders");
  // Unpaid checkout attempts stay "pending"; hide them from the customer's history.
  const orders = (await getMyOrders(user.id)).filter((o) => o.status !== "pending");

  return (
    <Container className="space-y-8 py-10">
      <PageHeader title="My orders" description="Track and review your purchases." />
      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-12" />}
          title="No orders yet"
          description="When you place an order, it will show up here."
          action={<ButtonLink href="/search">Start shopping</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
          {orders.map((o) => {
            const count = (o.items ?? []).reduce((s, i) => s + i.quantity, 0);
            return (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center gap-4 p-5 hover:bg-neutral-50">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{orderNumber(o.id)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-sm text-neutral-500">
                      {formatDate(o.created_at)} · {count} item{count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="font-semibold">{formatPrice(o.total_paise)}</span>
                  <ChevronRight className="size-5 text-neutral-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
