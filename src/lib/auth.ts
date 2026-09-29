import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile | null;
  isAdmin: boolean;
}

/** The signed-in user (verified with Supabase Auth) or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Reading cookies marks every page as per-request (the store is personalised
  // and stock/prices must always be fresh), even before Supabase is configured.
  await cookies();
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, role")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    return {
      id: user.id,
      email: user.email ?? "",
      profile: profile ?? null,
      isAdmin: profile?.role === "admin",
    };
  } catch {
    return null;
  }
});

/** Require a signed-in user in a page; redirects to /login otherwise. */
export async function requireUser(next: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Require an admin in a page. Non-admins get a 404 so the admin area stays hidden. */
export async function requireAdminPage() {
  const user = await requireUser("/admin");
  if (!user.isAdmin) notFound();
  return user;
}

/** For server actions: returns the admin user or null (never throws a redirect). */
export async function getAdminOrNull() {
  const user = await getSessionUser();
  return user?.isAdmin ? user : null;
}
