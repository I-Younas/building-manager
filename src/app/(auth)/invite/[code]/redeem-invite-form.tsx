"use client";

import { useActionState } from "react";
import { redeemInvite } from "@/lib/actions/invites";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function RedeemInviteForm({ code, lockedEmail }: { code: string; lockedEmail: string | null }) {
  const [state, formAction, pending] = useActionState(redeemInvite.bind(null, code), undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <label className={labelClasses}>
        Your name
        <input name="name" required maxLength={100} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Email
        <input
          name="email"
          type="email"
          required
          defaultValue={lockedEmail ?? ""}
          readOnly={!!lockedEmail}
          className={`${inputClasses} ${lockedEmail ? "bg-slate-100" : ""}`}
        />
      </label>

      <label className={labelClasses}>
        Password
        <input name="password" type="password" required minLength={8} className={inputClasses} />
      </label>
      <p className="text-sm text-slate-500">
        If you already have an account with this email, enter its existing password to join. Otherwise this
        password will create your new account.
      </p>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Joining..." : "Join"}
      </Button>
    </form>
  );
}
