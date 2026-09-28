import { Alert } from "@/components/ui/Feedback";

/** Friendly message shown when the store can't reach Supabase (usually missing .env.local). */
export function SetupNotice({ error }: { error?: string }) {
  return (
    <Alert tone="neutral" className="space-y-1">
      <p className="font-semibold text-neutral-900">We couldn&apos;t load products right now.</p>
      <p>
        If you are the store owner: check that <code>.env.local</code> has your Supabase URL and anon key and that
        you ran <code>supabase/schema.sql</code> and <code>supabase/seed.sql</code> (see SETUP.md).
      </p>
      {error && process.env.NODE_ENV !== "production" && <p className="text-xs text-neutral-500">Details: {error}</p>}
    </Alert>
  );
}
