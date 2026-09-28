"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/format";
import type { ProductImage } from "@/types";

export function ImageGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return <div className="grid aspect-square place-items-center rounded-3xl bg-neutral-50 text-neutral-400">No image</div>;
  }

  return (
    <div className="space-y-4">
      <figure>
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-neutral-50">
          <Image
            src={current.url}
            alt={current.description || name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain p-6 sm:p-10"
          />
        </div>
        {current.description && (
          <figcaption className="mt-2 text-center text-xs text-neutral-500">{current.description}</figcaption>
        )}
      </figure>
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-neutral-50",
                i === active ? "border-brand-600" : "border-transparent hover:border-neutral-300",
              )}
            >
              <Image src={img.url} alt={img.description || name} fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
