"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <h1 className="text-xl font-semibold text-slate-900">Log in</h1>

      <label className={labelClasses}>
        Email
        <input name="email" type="email" required className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Password
        <input name="password" type="password" required className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Logging in..." : "Log in"}
      </Button>

      <p className="text-sm text-slate-500">
        Setting up a new building?{" "}
        <Link href="/signup" className="font-medium text-blue-600 hover:underline">
          Create an organization
        </Link>
      </p>
    </form>
  );
}
