"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** While a payment is being confirmed (e.g. waiting for the webhook), re-check a few times. */
export function PendingRefresher({ attempts = 10, intervalMs = 3000 }: { attempts?: number; intervalMs?: number }) {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= attempts) return;
    const t = setTimeout(() => {
      router.refresh();
      setCount((c) => c + 1);
    }, intervalMs);
    return () => clearTimeout(t);
  }, [count, attempts, intervalMs, router]);

  return null;
}
