import Image from "next/image";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/Container";
import { getAllProducts } from "@/lib/admin-queries";

export const metadata = { title: "Product images" };

export default async function AdminImagesPage() {
  const products = await getAllProducts();

  return (
    <div className="space-y-6">
      <PageHeader title="Product images" description="Pick a product to add, replace or describe its images." />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => {
          const missing = p.images.filter((i) => !i.description.trim()).length;
          return (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}/images`}
                className="block rounded-2xl border border-neutral-100 p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{p.name}</p>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {p.images.length} image{p.images.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  {p.images.slice(0, 4).map((img) => (
                    <div key={img.id} className="relative size-16 overflow-hidden rounded-lg bg-neutral-50">
                      <Image src={img.url} alt={img.description || p.name} fill sizes="64px" className="object-contain p-1" />
                    </div>
                  ))}
                  {p.images.length === 0 && (
                    <div className="grid size-16 place-items-center rounded-lg border border-dashed border-neutral-200 text-xs text-neutral-400">
                      None
                    </div>
                  )}
                </div>
                {missing > 0 && (
                  <p className="mt-3 flex items-center gap-1 text-xs text-amber-700">
                    <AlertCircle className="size-3.5" /> {missing} image{missing === 1 ? "" : "s"} without a description
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
