"use client";

import { useActionState } from "react";
import { updateContactInfo, type UpdateContactInfoState } from "@/lib/actions/account";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function AccountForm({
  email,
  phone,
  dict,
}: {
  email: string;
  phone: string;
  dict: Dictionary["account"];
}) {
  const [state, formAction, pending] = useActionState<UpdateContactInfoState, FormData>(updateContactInfo, undefined);

  return (
    <form action={formAction} className={formStackClasses}>
      <label className={labelClasses}>
        {dict.email}
        <input name="email" type="email" required defaultValue={email} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        {dict.phone}
        <input name="phone" type="tel" required maxLength={30} defaultValue={phone} className={inputClasses} />
      </label>

      {state && "error" in state ? <ErrorText>{state.error}</ErrorText> : null}
      {state && "success" in state ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{dict.success}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? dict.saving : dict.save}
      </Button>
    </form>
  );
}
