"use client";

import { useActionState } from "react";
import { redeemInvite } from "@/lib/actions/invites";

export function RedeemInviteForm({ code, lockedEmail }: { code: string; lockedEmail: string | null }) {
  const [state, formAction, pending] = useActionState(redeemInvite.bind(null, code), undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label>
        Your name
        <input name="name" required maxLength={100} />
      </label>

      <label>
        Email
        <input name="email" type="email" required defaultValue={lockedEmail ?? ""} readOnly={!!lockedEmail} />
      </label>

      <label>
        Password
        <input name="password" type="password" required minLength={8} />
      </label>
      <p>
        If you already have an account with this email, enter its existing password to join. Otherwise this
        password will create your new account.
      </p>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Joining..." : "Join"}
      </button>
    </form>
  );
}
