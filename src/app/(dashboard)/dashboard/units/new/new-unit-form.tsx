"use client";

import { useActionState } from "react";
import { createUnitFromForm } from "@/lib/actions/units";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

type Building = { id: string; name: string };

export function NewUnitForm({ buildings }: { buildings: Building[] }) {
  const [state, formAction, pending] = useActionState(createUnitFromForm, undefined);

  return (
    <form action={formAction} className={`${formStackClasses} max-w-md`}>
      <label className={labelClasses}>
        Building
        <select name="buildingId" required defaultValue="" className={inputClasses}>
          <option value="" disabled>
            Select a building
          </option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClasses}>
        Unit number
        <input name="unitNumber" required maxLength={50} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Floor
        <input name="floor" maxLength={50} className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Adding..." : "Add unit"}
      </Button>
    </form>
  );
}
