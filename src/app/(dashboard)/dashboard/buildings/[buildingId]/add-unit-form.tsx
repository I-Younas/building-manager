"use client";

import { useActionState } from "react";
import { createUnit } from "@/lib/actions/units";
import { Button, ErrorText, inputClasses, labelClasses } from "@/components/ui";

export function AddUnitForm({ buildingId }: { buildingId: string }) {
  const [state, formAction, pending] = useActionState(createUnit.bind(null, buildingId), undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className={labelClasses}>
        Unit number
        <input name="unitNumber" required maxLength={50} className={inputClasses} />
      </label>
      <label className={labelClasses}>
        Floor
        <input name="floor" maxLength={50} className={inputClasses} />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add unit"}
      </Button>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
