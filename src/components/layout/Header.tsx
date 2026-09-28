import Link from "next/link";
import { CATEGORY_LINKS } from "@/lib/nav";
import type { SessionUser } from "@/lib/auth";
import { CartIcon } from "./CartIcon";
import { MobileNav } from "./MobileNav";
import { SearchBar } from "./SearchBar";
import { UserMenu } from "./UserMenu";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Zivo home">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-lg font-black text-white">Z</span>
      <span className="text-2xl font-black tracking-tight text-neutral-900">
        Zivo<span className="text-brand-600">.</span>
      </span>
    </Link>
  );
}

export function Header({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <MobileNav user={user} />
        <Logo />

        <nav aria-label="Categories" className="ml-6 hidden items-center gap-6 lg:flex">
          {CATEGORY_LINKS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-600"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden md:block">
            <SearchBar />
          </div>
          <UserMenu user={user} />
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
