import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-neutral-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-neutral-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}
