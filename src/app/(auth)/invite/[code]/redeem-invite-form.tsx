"use client";

import { useActionState } from "react";
import { redeemInvite } from "@/lib/actions/invites";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { DatePicker } from "@/components/date-picker";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function RedeemInviteForm({
  code,
  isResident,
  dict,
}: {
  code: string;
  isResident: boolean;
  dict: Dictionary["auth"]["invite"];
}) {
  const [state, formAction, pending] = useActionState(redeemInvite.bind(null, code), undefined);

  return (
    <form action={formAction} className={formStackClasses}>
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
        {dict.password}
        <input name="password" type="password" required minLength={8} className={inputClasses} />
      </label>

      {isResident ? (
        <>
          <label className={labelClasses}>
            {dict.phone}
            <input name="phone" type="tel" required maxLength={30} className={inputClasses} />
          </label>

          <label className={labelClasses}>
            {dict.dateOfBirth}
            <DatePicker name="dateOfBirth" />
          </label>

          <label className={labelClasses}>
            {dict.emergencyContactName}
            <input name="emergencyContactName" required maxLength={100} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            {dict.emergencyContactPhone}
            <input name="emergencyContactPhone" type="tel" required maxLength={30} className={inputClasses} />
          </label>
        </>
      ) : null}

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending}>
        {pending ? dict.joining : dict.join}
      </Button>
    </form>
  );
}
