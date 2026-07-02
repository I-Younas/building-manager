"use client";

import { useActionState } from "react";
import type { FormActionState } from "@/lib/actions/buildings";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

type Action = (state: FormActionState, formData: FormData) => Promise<FormActionState>;

export function BuildingForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  defaultValues?: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    region: string | null;
    postalCode: string | null;
    country: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className={`${formStackClasses} max-w-lg`}>
      <label className={labelClasses}>
        Building name
        <input name="name" required maxLength={200} defaultValue={defaultValues?.name} className={inputClasses} />
      </label>
      <label className={labelClasses}>
        Address line 1
        <input
          name="addressLine1"
          required
          maxLength={200}
          defaultValue={defaultValues?.addressLine1}
          className={inputClasses}
        />
      </label>
      <label className={labelClasses}>
        Address line 2 (optional)
        <input
          name="addressLine2"
          maxLength={200}
          defaultValue={defaultValues?.addressLine2 ?? ""}
          className={inputClasses}
        />
      </label>
      <label className={labelClasses}>
        City
        <input name="city" required maxLength={100} defaultValue={defaultValues?.city} className={inputClasses} />
      </label>
      <label className={labelClasses}>
        Region/State
        <input name="region" maxLength={100} defaultValue={defaultValues?.region ?? ""} className={inputClasses} />
      </label>
      <label className={labelClasses}>
        Postal code
        <input
          name="postalCode"
          maxLength={20}
          defaultValue={defaultValues?.postalCode ?? ""}
          className={inputClasses}
        />
      </label>
      <label className={labelClasses}>
        Country
        <input
          name="country"
          required
          maxLength={100}
          defaultValue={defaultValues?.country}
          className={inputClasses}
        />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
