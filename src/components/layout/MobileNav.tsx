"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { signOut } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { CATEGORY_LINKS } from "@/lib/nav";
import { SearchBar } from "./SearchBar";

export function MobileNav({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  // Close the drawer after navigating.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass = "block rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-neutral-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xl font-black">
                Zivo<span className="text-brand-600">.</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-10 place-items-center rounded-full hover:bg-neutral-100"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <SearchBar className="mb-4 [&_input]:w-full" />
            <nav className="flex-1 space-y-1 overflow-y-auto">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Shop</p>
              {CATEGORY_LINKS.map((c) => (
                <Link key={c.href} href={c.href} className={linkClass}>
                  {c.name}
                </Link>
              ))}
              <Link href="/search" className={linkClass}>
                All shoes
              </Link>
              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">Account</p>
              {user ? (
                <>
                  <Link href="/account" className={linkClass}>
                    My account
                  </Link>
                  <Link href="/account/orders" className={linkClass}>
                    My orders
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin" className={linkClass}>
                      Admin dashboard
                    </Link>
                  )}
                  <form action={signOut}>
                    <button type="submit" className={`${linkClass} w-full text-left text-brand-700`}>
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className={linkClass}>
                    Log in
                  </Link>
                  <Link href="/signup" className={linkClass}>
                    Create account
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
