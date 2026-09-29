"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createProduct, updateProduct } from "@/actions/admin-products";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { slugify } from "@/lib/format";
import { SIZES } from "@/lib/pricing";
import type { Category, Product } from "@/types";

export function ProductForm({ categories, product }: { categories: Category[]; product?: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const stockFor = (size: string) => product?.variants.find((v) => v.size === size)?.stock ?? 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input = {
      name,
      slug,
      category_id: String(f.get("category_id") ?? ""),
      description: String(f.get("description") ?? ""),
      price: String(f.get("price") ?? ""),
      compare_at_price: String(f.get("compare_at_price") ?? ""),
      is_featured: f.get("is_featured") === "on",
      is_active: f.get("is_active") === "on",
      stock: Object.fromEntries(SIZES.map((s) => [s, String(f.get(`stock_${s}`) ?? "0")])),
    };

    setPending(true);
    setError("");
    setSaved(false);
    if (product) {
      const res = await updateProduct(product.id, input);
      setPending(false);
      if (!res.ok) return setError(res.error);
      setSaved(true);
      router.refresh();
    } else {
      const res = await createProduct(input);
      if (!res.ok) {
        setPending(false);
        return setError(res.error);
      }
      // New products go straight to the image manager to add photos.
      router.push(`/admin/products/${res.data!.id}/images?new=1`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="green">Product saved.</Alert>}

      <section className="grid gap-5 rounded-2xl border border-neutral-100 p-6 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" className="sm:col-span-2">
          <Input
            id="name"
            value={name}
            required
            maxLength={120}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="URL slug" htmlFor="slug" hint={`Product URL: /product/${slug || "…"}`}>
          <Input
            id="slug"
            value={slug}
            required
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="Category" htmlFor="category_id">
          <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""} required>
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Price (₹)" htmlFor="price" hint="Including GST">
          <Input
            id="price"
            name="price"
            type="number"
            min="1"
            step="0.01"
            required
            defaultValue={product ? product.price_paise / 100 : ""}
          />
        </Field>
        <Field label="Compare-at price (₹)" htmlFor="compare_at_price" hint="Optional original price, shows a “Sale” badge">
          <Input
            id="compare_at_price"
            name="compare_at_price"
            type="number"
            min="1"
            step="0.01"
            defaultValue={product?.compare_at_paise ? product.compare_at_paise / 100 : ""}
          />
        </Field>
        <Field label="Description" htmlFor="description" className="sm:col-span-2">
          <Textarea id="description" name="description" rows={5} maxLength={4000} defaultValue={product?.description ?? ""} />
        </Field>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-4 accent-brand-600" />
            Visible in store
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="size-4 accent-brand-600" />
            Featured on home page
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-100 p-6">
        <h2 className="mb-1 font-semibold">Stock per size (UK)</h2>
        <p className="mb-4 text-sm text-neutral-500">Set 0 for sizes that are sold out.</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SIZES.map((s) => (
            <Field key={s} label={`UK ${s}`} htmlFor={`stock_${s}`}>
              <Input id={`stock_${s}`} name={`stock_${s}`} type="number" min="0" step="1" defaultValue={stockFor(s)} />
            </Field>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" size="lg" loading={pending}>
          {product ? "Save changes" : "Create product & add images"}
        </Button>
        <Button type="button" size="lg" variant="ghost" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
