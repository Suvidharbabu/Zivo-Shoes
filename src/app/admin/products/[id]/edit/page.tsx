import { notFound } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Container";
import { getProductById } from "@/lib/admin-queries";
import { getCategories } from "@/lib/queries";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductById(id), getCategories()]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${product.name}`}>
        <ButtonLink href={`/admin/products/${product.id}/images`} variant="secondary">
          <ImageIcon className="size-4" /> Manage images ({product.images.length})
        </ButtonLink>
      </PageHeader>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
