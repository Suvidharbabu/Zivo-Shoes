"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, Package, User } from "lucide-react";
import { signOut } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth";

export function UserMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 sm:inline-flex"
      >
        Log in
      </Link>
    );
  }

  const name = user.profile?.full_name || user.email;
  const itemClass = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50";

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid size-10 place-items-center rounded-full text-neutral-800 hover:bg-neutral-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <User className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-neutral-100 bg-white p-2 shadow-lg"
        >
          <p className="truncate px-3 py-2 text-xs text-neutral-500">Signed in as {name}</p>
          <Link href="/account" className={itemClass} onClick={() => setOpen(false)} role="menuitem">
            <User className="size-4" /> My account
          </Link>
          <Link href="/account/orders" className={itemClass} onClick={() => setOpen(false)} role="menuitem">
            <Package className="size-4" /> My orders
          </Link>
          {user.isAdmin && (
            <Link href="/admin" className={itemClass} onClick={() => setOpen(false)} role="menuitem">
              <LayoutDashboard className="size-4" /> Admin dashboard
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className={`${itemClass} w-full text-left`} role="menuitem">
              <LogOut className="size-4" /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
