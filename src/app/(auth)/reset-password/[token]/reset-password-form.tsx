"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function ResetPasswordForm({ token, dict }: { token: string; dict: Dictionary["auth"]["resetPassword"] }) {
  const [state, formAction, pending] = useActionState(resetPassword.bind(null, token), undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <label className={labelClasses}>
        {dict.newPassword}
        <input name="password" type="password" required minLength={8} className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending}>
        {pending ? dict.saving : dict.setNewPassword}
      </Button>
    </form>
  );
}
