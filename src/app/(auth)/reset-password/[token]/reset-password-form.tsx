"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword.bind(null, token), undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <label className={labelClasses}>
        New password
        <input name="password" type="password" required minLength={8} className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Set new password"}
      </Button>
    </form>
  );
}
