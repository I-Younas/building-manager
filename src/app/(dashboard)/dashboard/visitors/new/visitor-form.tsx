"use client";

import { useActionState } from "react";
import { registerVisitor } from "@/lib/actions/visitors";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

type Unit = { id: string; unitNumber: string; buildingName: string };

export function VisitorForm({ units }: { units: Unit[] }) {
  const [state, formAction, pending] = useActionState(registerVisitor, undefined);

  return (
    <form action={formAction} className={`${formStackClasses} max-w-lg`}>
      <label className={labelClasses}>
        Unit
        <select name="unitId" required defaultValue={units.length === 1 ? units[0].id : ""} className={inputClasses}>
          <option value="" disabled>
            Select a unit
          </option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.buildingName} / Unit {unit.unitNumber}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClasses}>
        Visitor name
        <input name="name" required maxLength={200} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Phone (optional)
        <input name="phone" maxLength={30} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Purpose (optional)
        <input name="purpose" maxLength={500} placeholder="e.g. Delivery, guest" className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Expected arrival
        <input type="datetime-local" name="expectedAt" required className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Registering..." : "Register visitor"}
      </Button>
    </form>
  );
}
