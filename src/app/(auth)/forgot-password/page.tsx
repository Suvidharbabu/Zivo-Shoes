import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mb-8 mt-1 text-sm text-neutral-500">Enter your email and we&apos;ll send you a reset link.</p>
      <ForgotPasswordForm />
    </>
  );
}
