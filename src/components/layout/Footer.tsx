import Link from "next/link";
import { CATEGORY_LINKS } from "@/lib/nav";

export function Footer() {
  const year = new Date().getFullYear();
  const heading = "text-sm font-semibold text-neutral-900";
  const link = "text-sm text-neutral-500 hover:text-brand-600";

  return (
    <footer className="mt-24 border-t border-neutral-100 bg-neutral-50">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-2xl font-black">
            Zivo<span className="text-brand-600">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-neutral-500">
            Sneakers, running shoes and boots made for every step. Free shipping on orders over ₹999.
          </p>
        </div>
        <div className="space-y-3">
          <p className={heading}>Shop</p>
          <ul className="space-y-2">
            {CATEGORY_LINKS.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className={link}>
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search" className={link}>
                All shoes
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className={heading}>Account</p>
          <ul className="space-y-2">
            <li>
              <Link href="/account" className={link}>
                My account
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className={link}>
                My orders
              </Link>
            </li>
            <li>
              <Link href="/cart" className={link}>
                Cart
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className={heading}>Help</p>
          <ul className="space-y-2 text-sm text-neutral-500">
            <li>Free shipping over ₹999</li>
            <li>Secure payments by Razorpay</li>
            <li>Prices include GST</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400">
        © {year} Zivo. All rights reserved.
      </div>
    </footer>
  );
}
