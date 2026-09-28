"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-neutral-500">
        We couldn&apos;t load this page. Please try again in a moment. If you run this store, check the server logs
        and that your Supabase keys are set (see SETUP.md).
      </p>
      {error.digest && <p className="mt-2 text-xs text-neutral-400">Error reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </Container>
  );
}
