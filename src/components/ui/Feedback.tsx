import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import type { OrderStatus } from "@/types";

type Tone = "neutral" | "red" | "green" | "amber" | "blue";

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  red: "bg-brand-50 text-brand-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-800",
  blue: "bg-blue-50 text-blue-700",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

const statusTone: Record<OrderStatus, Tone> = {
  pending: "amber",
  paid: "green",
  shipped: "blue",
  delivered: "neutral",
  cancelled: "red",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={statusTone[status]} className="capitalize">
      {status === "pending" ? "Payment pending" : status}
    </Badge>
  );
}

export function Alert({
  tone = "red",
  children,
  className,
}: {
  tone?: "red" | "green" | "neutral";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    red: "border-brand-200 bg-brand-50 text-brand-800",
    green: "border-green-200 bg-green-50 text-green-800",
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
  }[tone];
  return (
    <div role={tone === "red" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", styles, className)}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-neutral-300">{icon}</div>}
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-neutral-100", className)} />;
}
