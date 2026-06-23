"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Button, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
      <p className="text-sm text-slate-500">
        Enter the email on your account and we&apos;ll send you a link to choose a new password.
      </p>

      <label className={labelClasses}>
        Email
        <input name="email" type="email" required className={inputClasses} />
      </label>

      {state?.message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>

      <p className="text-sm text-slate-500">
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
