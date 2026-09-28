import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/AuthForms";
import { getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/nav";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  if (await getSessionUser()) redirect(next);

  return (
    <>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mb-8 mt-1 text-sm text-neutral-500">Save your cart, check out faster and track your orders.</p>
      <SignupForm next={next} />
    </>
  );
}
