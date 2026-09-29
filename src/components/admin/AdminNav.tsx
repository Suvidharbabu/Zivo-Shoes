"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, LayoutDashboard, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/images", label: "Images", icon: ImageIcon },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              active ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
