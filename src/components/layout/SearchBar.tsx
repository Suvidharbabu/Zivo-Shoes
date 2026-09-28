import Form from "next/form";
import { Search } from "lucide-react";
import { cn } from "@/lib/format";

/** GET form to /search — works without JavaScript. */
export function SearchBar({ className, defaultValue }: { className?: string; defaultValue?: string }) {
  return (
    <Form action="/search" className={cn("relative", className)} role="search">
      <label htmlFor="site-search" className="sr-only">
        Search shoes
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search shoes…"
        className="h-10 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 md:w-56"
      />
    </Form>
  );
}
