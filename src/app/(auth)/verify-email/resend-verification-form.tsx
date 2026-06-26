"use client";

import { useActionState } from "react";
import { resendVerificationEmail } from "@/lib/actions/auth";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Button } from "@/components/ui";

export function ResendVerificationForm({ dict }: { dict: Dictionary["auth"]["verifyEmail"] }) {
  const [state, formAction, pending] = useActionState(resendVerificationEmail, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Button type="submit" disabled={pending} variant="secondary">
        {dict.resend}
      </Button>
      {state?.sent ? <p className="text-sm text-emerald-700">{dict.resent}</p> : null}
    </form>
  );
}
