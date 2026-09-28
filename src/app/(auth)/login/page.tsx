import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/AuthForms";
import { getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/nav";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  if (await getSessionUser()) redirect(next);

  const error =
    sp.error === "link"
      ? "That link is invalid or has expired. Please try again."
      : undefined;

  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mb-8 mt-1 text-sm text-neutral-500">Log in to your Zivo account.</p>
      <LoginForm next={next} initialError={error} />
    </>
  );
}
