"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/admin-products";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete ${name}`}
      className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40"
      onClick={() => {
        if (!confirm(`Delete “${name}”? This also deletes its images and sizes. Past orders keep their details.`)) return;
        startTransition(async () => {
          const res = await deleteProduct(id);
          if (!res.ok) alert(res.error);
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
