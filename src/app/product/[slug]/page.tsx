import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { AddToCart } from "@/components/product/AddToCart";
import { ImageGallery } from "@/components/product/ImageGallery";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Feedback";
import { formatPrice } from "@/lib/format";
import { primaryImage, totalStock } from "@/lib/product";
import { getProductBySlug } from "@/lib/queries";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product not found" };
  const image = primaryImage(product);
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: image ? { images: [{ url: image.url, alt: image.description || product.name }] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stock = totalStock(product);
  const onSale = product.compare_at_paise && product.compare_at_paise > product.price_paise;

  return (
    <Container className="py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900">Home</Link>
        <ChevronRight className="size-4" />
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-neutral-900">
              {product.category.name}
            </Link>
            <ChevronRight className="size-4" />
          </>
        )}
        <span className="truncate text-neutral-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ImageGallery images={product.images} name={product.name} />

        <div className="space-y-8">
          <div className="space-y-3">
            {product.category && <p className="text-sm font-medium text-brand-600">{product.category.name}</p>}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-semibold">{formatPrice(product.price_paise)}</span>
              {onSale && (
                <>
                  <span className="text-lg text-neutral-400 line-through">{formatPrice(product.compare_at_paise!)}</span>
                  <Badge tone="red">
                    Save {formatPrice(product.compare_at_paise! - product.price_paise)}
                  </Badge>
                </>
              )}
            </div>
            <p className="text-xs text-neutral-500">Inclusive of all taxes</p>
            <p className="text-sm font-medium">
              {stock === 0 ? (
                <span className="text-neutral-500">Currently out of stock</span>
              ) : (
                <span className="text-green-700">In stock — ready to ship</span>
              )}
            </p>
          </div>

          <AddToCart variants={product.variants} />

          <div className="space-y-3 border-t border-neutral-100 pt-8">
            <h2 className="font-semibold">Description</h2>
            <p className="leading-relaxed text-neutral-600">{product.description}</p>
          </div>

          <ul className="grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
            <li className="flex items-center gap-2 rounded-xl bg-neutral-50 p-4">
              <Truck className="size-5 text-brand-600" /> Free shipping over ₹999
            </li>
            <li className="flex items-center gap-2 rounded-xl bg-neutral-50 p-4">
              <ShieldCheck className="size-5 text-brand-600" /> Secure checkout with Razorpay
            </li>
          </ul>
        </div>
      </div>
    </Container>
  );
}
