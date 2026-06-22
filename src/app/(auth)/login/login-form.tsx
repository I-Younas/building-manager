"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Log in</h1>

      <label>
        Email
        <input name="email" type="email" required />
      </label>

      <label>
        Password
        <input name="password" type="password" required />
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Logging in..." : "Log in"}
      </button>

      <p>
        Setting up a new building? <Link href="/signup">Create an organization</Link>
      </p>
    </form>
  );
}
