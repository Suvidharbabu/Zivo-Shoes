"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, RefreshCw, Star, Trash2, Upload } from "lucide-react";
import {
  addProductImage,
  deleteProductImage,
  moveImage,
  replaceProductImage,
  setPrimaryImage,
  updateImageDescription,
} from "@/actions/admin-images";
import { Button } from "@/components/ui/Button";
import { Alert, Badge } from "@/components/ui/Feedback";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { ProductImage } from "@/types";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const ACCEPT = Object.keys(EXT_BY_TYPE).join(",");

type Result = { ok: true } | { ok: false; error: string };

function checkFile(file: File): string | null {
  if (!EXT_BY_TYPE[file.type]) return `${file.name}: only JPG, PNG, WebP or AVIF images are allowed.`;
  if (file.size > MAX_BYTES) return `${file.name}: file is larger than 5 MB.`;
  return null;
}

/** Uploads straight to Supabase Storage as the signed-in admin (storage policies enforce admin-only). */
async function uploadFile(productId: string, file: File): Promise<{ path: string } | { error: string }> {
  const problem = checkFile(file);
  if (problem) return { error: problem };
  const path = `${productId}/${crypto.randomUUID()}.${EXT_BY_TYPE[file.type]}`;
  const { error } = await createClient().storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { error: `${file.name}: ${error.message}` };
  return { path };
}

function ImageCard({
  image,
  index,
  count,
  productId,
  productName,
  onResult,
}: {
  image: ProductImage;
  index: number;
  count: number;
  productId: string;
  productName: string;
  onResult: (r: Result, success?: string) => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(image.description);
  const [pending, startTransition] = useTransition();
  const replaceRef = useRef<HTMLInputElement>(null);
  const dirty = description.trim() !== image.description;

  function run(fn: () => Promise<Result>, success?: string) {
    startTransition(async () => {
      const res = await fn();
      onResult(res, success);
      router.refresh();
    });
  }

  return (
    <li className={cn("flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row", image.is_primary ? "border-brand-200 bg-brand-50/30" : "border-neutral-100")}>
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-neutral-50 sm:w-40">
        <Image src={image.url} alt={image.description || productName} fill sizes="160px" className="object-contain p-2" />
        {pending && <div className="absolute inset-0 animate-pulse bg-white/60" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Image {index + 1}</span>
          {image.is_primary && <Badge tone="red">Primary (shown on product cards)</Badge>}
          {!image.storage_path && <Badge>Built-in image</Badge>}
        </div>

        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-600">Description (alt text / caption)</span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={300}
            className="min-h-0"
            placeholder="e.g. Side view of the blue canvas high-top"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={!dirty || pending}
            onClick={() => run(() => updateImageDescription(image.id, description), "Description saved.")}
          >
            Save description
          </Button>
          {dirty && (
            <button type="button" className="text-sm text-neutral-500 hover:text-neutral-900" onClick={() => setDescription(image.description)}>
              Undo
            </button>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-1 border-t border-neutral-100 pt-3">
          {!image.is_primary && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setPrimaryImage(image.id), "Primary image updated.")}>
              <Star className="size-4" /> Make primary
            </Button>
          )}
          <Button size="sm" variant="ghost" disabled={pending || index === 0} onClick={() => run(() => moveImage(image.id, "up"))} aria-label="Move up">
            <ArrowUp className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" disabled={pending || index === count - 1} onClick={() => run(() => moveImage(image.id, "down"))} aria-label="Move down">
            <ArrowDown className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => replaceRef.current?.click()}>
            <RefreshCw className="size-4" /> Replace
          </Button>
          <input
            ref={replaceRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              run(async () => {
                const up = await uploadFile(productId, file);
                if ("error" in up) return { ok: false, error: up.error };
                return replaceProductImage(image.id, up.path);
              }, "Image replaced.");
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-brand-700 hover:bg-brand-50"
            disabled={pending}
            onClick={() => {
              if (confirm("Delete this image? This cannot be undone.")) run(() => deleteProductImage(image.id), "Image deleted.");
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </div>
    </li>
  );
}

export function ImageManager({ productId, productName, images }: { productId: string; productName: string; images: ProductImage[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onResult(res: Result, success?: string) {
    if (!res.ok) setMessage({ ok: false, text: res.error });
    else if (success) setMessage({ ok: true, text: success });
  }

  async function uploadMany(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setMessage(null);
    const errors: string[] = [];
    let added = 0;
    for (const file of files) {
      const up = await uploadFile(productId, file);
      if ("error" in up) {
        errors.push(up.error);
        continue;
      }
      const res = await addProductImage(productId, up.path, productName);
      if (res.ok) added++;
      else errors.push(`${file.name}: ${res.error}`);
    }
    setUploading(false);
    setMessage(
      errors.length
        ? { ok: false, text: `${added} uploaded. ${errors.join(" ")}` }
        : { ok: true, text: `${added} image${added === 1 ? "" : "s"} uploaded. Add a description for each one below.` },
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void uploadMany(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-brand-600 bg-brand-50" : "border-neutral-200",
        )}
      >
        <Upload className="mb-3 size-8 text-neutral-400" />
        <p className="font-semibold">Drag images here or</p>
        <Button className="mt-3" onClick={() => inputRef.current?.click()} loading={uploading}>
          {uploading ? "Uploading…" : "Choose images"}
        </Button>
        <p className="mt-3 text-xs text-neutral-500">JPG, PNG, WebP or AVIF · up to 5 MB each · square images look best</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void uploadMany(files);
          }}
        />
      </div>

      {message && <Alert tone={message.ok ? "green" : "red"}>{message.text}</Alert>}

      {images.length === 0 ? (
        <p className="text-center text-sm text-neutral-500">This product has no images yet.</p>
      ) : (
        <ul className="space-y-4">
          {images.map((img, i) => (
            <ImageCard
              key={img.id}
              image={img}
              index={i}
              count={images.length}
              productId={productId}
              productName={productName}
              onResult={onResult}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
