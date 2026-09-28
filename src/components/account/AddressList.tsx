"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAddress, setDefaultAddress } from "@/actions/account";
import { Badge } from "@/components/ui/Feedback";
import type { Address } from "@/types";

export function AddressText({ address }: { address: Omit<Address, "id" | "is_default"> }) {
  return (
    <div className="text-sm leading-relaxed text-neutral-600">
      <p className="font-semibold text-neutral-900">{address.full_name}</p>
      <p>
        {address.line1}
        {address.line2 && `, ${address.line2}`}
      </p>
      <p>
        {address.city}, {address.state} {address.pincode}
      </p>
      <p>Phone: {address.phone}</p>
    </div>
  );
}

export function AddressList({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      router.refresh();
    });
  }

  if (!addresses.length) {
    return <p className="text-sm text-neutral-500">No saved addresses yet. You can add one at checkout.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-200 p-4">
            <div className="space-y-2">
              {a.is_default && <Badge tone="red">Default</Badge>}
              <AddressText address={a} />
            </div>
            <div className="flex gap-4 text-sm">
              {!a.is_default && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => setDefaultAddress(a.id))}
                  className="font-medium text-neutral-700 hover:text-neutral-900"
                >
                  Make default
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteAddress(a.id))}
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
