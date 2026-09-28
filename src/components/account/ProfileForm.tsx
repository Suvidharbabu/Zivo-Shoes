"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/account";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Input";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);

  return (
    <form action={action} className="space-y-4">
      {state?.ok === true && <Alert tone="green">Your details were saved.</Alert>}
      {state?.ok === false && <Alert>{state.error}</Alert>}
      <Field label="Email" htmlFor="email">
        <Input id="email" value={email} disabled readOnly />
      </Field>
      <Field label="Full name" htmlFor="full_name">
        <Input id="full_name" name="full_name" defaultValue={fullName} maxLength={80} />
      </Field>
      <Field label="Phone" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={phone} maxLength={20} />
      </Field>
      <Button type="submit" loading={pending}>
        Save details
      </Button>
    </form>
  );
}
