"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupOrgAdmin } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupOrgAdmin, undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Create your organization</h1>

      <label>
        Organization name
        <input name="organizationName" required minLength={2} maxLength={100} />
      </label>

      <label>
        Your name
        <input name="name" required maxLength={100} />
      </label>

      <label>
        Email
        <input name="email" type="email" required />
      </label>

      <label>
        Password
        <input name="password" type="password" required minLength={8} />
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create organization"}
      </button>

      <p>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}
