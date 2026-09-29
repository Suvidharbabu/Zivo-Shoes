import Image from "next/image";
import Link from "next/link";
import { Image as ImageIcon, Pencil, Plus } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Container";
import { Badge, EmptyState } from "@/components/ui/Feedback";
import { getAllProducts } from "@/lib/admin-queries";
import { formatPrice } from "@/lib/format";
import { primaryImage, totalStock } from "@/lib/product";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description={`${products.length} products`}>
        <ButtonLink href="/admin/products/new">
          <Plus className="size-4" /> Add product
        </ButtonLink>
      </PageHeader>

      {products.length === 0 ? (
        <EmptyState title="No products yet" action={<ButtonLink href="/admin/products/new">Add your first product</ButtonLink>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => {
                const img = primaryImage(p);
                const stock = totalStock(p);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                          {img && <Image src={img.url} alt={img.description || p.name} fill sizes="48px" className="object-contain p-1" />}
                        </div>
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-neutral-500">{p.images.length} image{p.images.length === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{p.category?.name}</td>
                    <td className="px-4 py-3">{formatPrice(p.price_paise)}</td>
                    <td className="px-4 py-3">
                      <span className={stock === 0 ? "font-semibold text-brand-700" : ""}>{stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.is_active ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}
                        {p.is_featured && <Badge tone="red">Featured</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          aria-label={`Edit ${p.name}`}
                          className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${p.id}/images`}
                          aria-label={`Manage images for ${p.name}`}
                          className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          <ImageIcon className="size-4" />
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
