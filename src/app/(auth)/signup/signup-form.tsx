"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupOrgAdmin } from "@/lib/actions/auth";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function SignupForm({ dict }: { dict: Dictionary["auth"]["signup"] }) {
  const [state, formAction, pending] = useActionState(signupOrgAdmin, undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <h1 className="text-xl font-semibold text-slate-900">{dict.title}</h1>

      <label className={labelClasses}>
        {dict.orgName}
        <input name="organizationName" required minLength={2} maxLength={100} className={inputClasses} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClasses}>
          {dict.firstName}
          <input name="firstName" required maxLength={50} className={inputClasses} />
        </label>
        <label className={labelClasses}>
          {dict.lastName}
          <input name="lastName" required maxLength={50} className={inputClasses} />
        </label>
      </div>

      <label className={labelClasses}>
        {dict.email}
        <input name="email" type="email" required className={inputClasses} />
      </label>

      <label className={labelClasses}>
        {dict.phone}
        <input name="phone" type="tel" required maxLength={30} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        {dict.password}
        <input name="password" type="password" required minLength={8} className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending}>
        {pending ? dict.creating : dict.createOrganization}
      </Button>

      <p className="text-sm text-slate-500">
        {dict.haveAccount}{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          {dict.logIn}
        </Link>
      </p>
    </form>
  );
}
