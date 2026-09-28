import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Feedback";
import { formatPrice } from "@/lib/format";
import { primaryImage, totalStock } from "@/lib/product";
import type { Product } from "@/types";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const image = primaryImage(product);
  const soldOut = totalStock(product) === 0;
  const onSale = product.compare_at_paise && product.compare_at_paise > product.price_paise;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50">
        {image ? (
          <Image
            src={image.url}
            alt={image.description || product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-neutral-400">No image</div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {soldOut && <Badge>Sold out</Badge>}
          {!soldOut && onSale && <Badge tone="red">Sale</Badge>}
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {product.category && <p className="text-xs text-neutral-500">{product.category.name}</p>}
        <h3 className="font-semibold text-neutral-900 group-hover:text-brand-600">{product.name}</h3>
        <p className="flex items-baseline gap-2 text-sm">
          <span className="font-semibold text-neutral-900">{formatPrice(product.price_paise)}</span>
          {onSale && (
            <span className="text-neutral-400 line-through">{formatPrice(product.compare_at_paise!)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-square animate-pulse rounded-2xl bg-neutral-100" />
          <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
