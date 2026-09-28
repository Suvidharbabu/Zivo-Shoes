import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  return (
    <>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      {user ? (
        <>
          <p className="mb-8 mt-1 text-sm text-neutral-500">Signed in as {user.email}.</p>
          <ResetPasswordForm />
        </>
      ) : (
        <div className="mt-6 space-y-6">
          <Alert tone="neutral">Your reset link has expired or was already used. Please request a new one.</Alert>
          <ButtonLink href="/forgot-password" className="w-full">
            Request a new link
          </ButtonLink>
        </div>
      )}
    </>
  );
}
