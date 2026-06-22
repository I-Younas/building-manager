"use client";

import { useActionState } from "react";
import type { FormActionState } from "@/lib/actions/buildings";

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
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <label>
        Building name
        <input name="name" required maxLength={200} defaultValue={defaultValues?.name} />
      </label>
      <label>
        Address line 1
        <input name="addressLine1" required maxLength={200} defaultValue={defaultValues?.addressLine1} />
      </label>
      <label>
        Address line 2
        <input name="addressLine2" maxLength={200} defaultValue={defaultValues?.addressLine2 ?? ""} />
      </label>
      <label>
        City
        <input name="city" required maxLength={100} defaultValue={defaultValues?.city} />
      </label>
      <label>
        Region/State
        <input name="region" maxLength={100} defaultValue={defaultValues?.region ?? ""} />
      </label>
      <label>
        Postal code
        <input name="postalCode" maxLength={20} defaultValue={defaultValues?.postalCode ?? ""} />
      </label>
      <label>
        Country
        <input name="country" required maxLength={100} defaultValue={defaultValues?.country} />
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
