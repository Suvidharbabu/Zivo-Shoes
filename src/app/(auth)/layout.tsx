import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center px-4 py-14 sm:py-20">
      <div className="w-full max-w-md rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-10">{children}</div>
    </div>
  );
}
