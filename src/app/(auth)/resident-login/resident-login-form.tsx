"use client";

import { useActionState } from "react";
import Link from "next/link";
import { residentLogin } from "@/lib/actions/auth";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function ResidentLoginForm({ dict }: { dict: Dictionary["auth"]["residentLogin"] }) {
  const [state, formAction, pending] = useActionState(residentLogin, undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <h1 className="text-xl font-semibold text-slate-900">{dict.title}</h1>

      <label className={labelClasses}>
        {dict.email}
        <input name="email" type="email" required className={inputClasses} />
      </label>

      <label className={labelClasses}>
        {dict.password}
        <input name="password" type="password" required className={inputClasses} />
      </label>
      <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
        {dict.forgotPassword}
      </Link>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending}>
        {pending ? dict.loggingIn : dict.logIn}
      </Button>

      <p className="text-sm text-slate-500">
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          {dict.adminLink}
        </Link>
      </p>
      <p className="text-sm text-slate-500">
        <Link href="/staff-login" className="font-medium text-blue-600 hover:underline">
          {dict.staffLink}
        </Link>
      </p>
    </form>
  );
}
