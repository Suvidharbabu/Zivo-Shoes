import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, Pencil } from "lucide-react";
import { ImageManager } from "@/components/admin/ImageManager";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Feedback";
import { getProductById } from "@/lib/admin-queries";

export const metadata = { title: "Manage images" };

export default async function ProductImagesPage({ params, searchParams }: PageProps<"/admin/products/[id]/images">) {
  const { id } = await params;
  const sp = await searchParams;
  const product = await getProductById(id);
  if (!product) notFound();

  // Show images in their manual order here (the store shows the primary image first).
  const images = [...product.images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <Link href="/admin/images" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft className="size-4" /> All product images
      </Link>
      <PageHeader title={`Images · ${product.name}`} description="Upload, replace, reorder and describe this product's images.">
        <div className="flex gap-2">
          <ButtonLink href={`/admin/products/${product.id}/edit`} variant="secondary" size="sm">
            <Pencil className="size-4" /> Edit details
          </ButtonLink>
          {product.is_active && (
            <ButtonLink href={`/product/${product.slug}`} variant="ghost" size="sm" target="_blank">
              <ExternalLink className="size-4" /> View
            </ButtonLink>
          )}
        </div>
      </PageHeader>
      {sp.new === "1" && <Alert tone="green">Product created! Now add some images.</Alert>}
      <ImageManager productId={product.id} productName={product.name} images={images} />
    </div>
  );
}
