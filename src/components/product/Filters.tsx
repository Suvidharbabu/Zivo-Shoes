import Form from "next/form";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { Category } from "@/types";

export interface FilterValues {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
}

/**
 * GET filter form. On category pages the category is fixed by the URL, so the
 * category selector is only shown on /search.
 */
export function Filters({
  action,
  values,
  categories,
}: {
  action: string;
  values: FilterValues;
  categories?: Category[];
}) {
  return (
    <Form
      action={action}
      className="grid grid-cols-2 gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4 sm:flex sm:flex-wrap sm:items-end"
    >
      {values.q !== undefined && <input type="hidden" name="q" value={values.q} />}
      {categories && (
        <label className="col-span-2 space-y-1 sm:w-44">
          <span className="text-xs font-medium text-neutral-600">Category</span>
          <Select name="category" defaultValue={values.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      <label className="space-y-1 sm:w-28">
        <span className="text-xs font-medium text-neutral-600">Min price (₹)</span>
        <Input name="min" type="number" inputMode="numeric" min={0} placeholder="0" defaultValue={values.min} />
      </label>
      <label className="space-y-1 sm:w-28">
        <span className="text-xs font-medium text-neutral-600">Max price (₹)</span>
        <Input name="max" type="number" inputMode="numeric" min={0} placeholder="Any" defaultValue={values.max} />
      </label>
      <label className="col-span-2 space-y-1 sm:w-44">
        <span className="text-xs font-medium text-neutral-600">Sort by</span>
        <Select name="sort" defaultValue={values.sort ?? "newest"}>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </Select>
      </label>
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="md">
          Apply
        </Button>
        <Link
          href={values.q ? `${action}?q=${encodeURIComponent(values.q)}` : action}
          className="inline-flex h-11 items-center px-3 text-sm text-neutral-500 hover:text-neutral-900"
        >
          Reset
        </Link>
      </div>
    </Form>
  );
}

/** Parse filter search params into query options. */
export function parseFilters(sp: Record<string, string | string[] | undefined>) {
  const one = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };
  const num = (k: string) => {
    const n = Number(one(k));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const sort = one("sort");
  return {
    values: { q: one("q"), category: one("category"), min: one("min"), max: one("max"), sort },
    minPrice: num("min"),
    maxPrice: num("max"),
    sort: (sort === "price-asc" || sort === "price-desc" ? sort : "newest") as "newest" | "price-asc" | "price-desc",
  };
}
