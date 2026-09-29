"use client";

import { useEffect, useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { resendOrderEmail } from "@/actions/order-email";
import { Button } from "@/components/ui/Button";

const COOLDOWN = 60;

function secondsLeft(lastSentAt: string | null) {
  if (!lastSentAt) return 0;
  const elapsed = (Date.now() - new Date(lastSentAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(COOLDOWN - elapsed));
}

export function ResendEmailButton({ orderId, lastSentAt, email }: { orderId: string; lastSentAt: string | null; email: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(() => secondsLeft(lastSentAt));

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function onClick() {
    setMessage(null);
    startTransition(async () => {
      const res = await resendOrderEmail(orderId);
      if (res.ok) {
        setMessage({ ok: true, text: `Confirmation email sent to ${email}.` });
        setCooldown(COOLDOWN);
      } else {
        setMessage({ ok: false, text: res.error });
        const match = /wait (\d+)s/.exec(res.error);
        if (match) setCooldown(Number(match[1]));
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" size="sm" onClick={onClick} loading={pending} disabled={cooldown > 0}>
        <Mail className="size-4" />
        {cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend confirmation email"}
      </Button>
      {message && (
        <p role="status" className={message.ok ? "text-sm text-green-700" : "text-sm text-brand-700"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
