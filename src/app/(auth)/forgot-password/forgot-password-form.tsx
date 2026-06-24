"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Button, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function ForgotPasswordForm({ dict }: { dict: Dictionary["auth"]["forgotPassword"] }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <h1 className="text-xl font-semibold text-slate-900">{dict.title}</h1>
      <p className="text-sm text-slate-500">{dict.description}</p>

      <label className={labelClasses}>
        {dict.email}
        <input name="email" type="email" required className={inputClasses} />
      </label>

      {state?.message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? dict.sending : dict.sendResetLink}
      </Button>

      <p className="text-sm text-slate-500">
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          {dict.backToLogin}
        </Link>
      </p>
    </form>
  );
}
