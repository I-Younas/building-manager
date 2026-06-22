"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupOrgAdmin } from "@/lib/actions/auth";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupOrgAdmin, undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <h1 className="text-xl font-semibold text-slate-900">Create your organization</h1>

      <label className={labelClasses}>
        Organization name
        <input name="organizationName" required minLength={2} maxLength={100} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Your name
        <input name="name" required maxLength={100} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Email
        <input name="email" type="email" required className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Password
        <input name="password" type="password" required minLength={8} className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create organization"}
      </Button>

      <p className="text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
