"use client";

import { useActionState } from "react";
import { registerVisitor } from "@/lib/actions/visitors";

type Unit = { id: string; unitNumber: string; buildingName: string };

export function VisitorForm({ units }: { units: Unit[] }) {
  const [state, formAction, pending] = useActionState(registerVisitor, undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <label>
        Unit
        <select name="unitId" required defaultValue={units.length === 1 ? units[0].id : ""}>
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

      <label>
        Visitor name
        <input name="name" required maxLength={200} />
      </label>

      <label>
        Phone (optional)
        <input name="phone" maxLength={30} />
      </label>

      <label>
        Purpose (optional)
        <input name="purpose" maxLength={500} placeholder="e.g. Delivery, guest" />
      </label>

      <label>
        Expected arrival
        <input type="datetime-local" name="expectedAt" required />
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Registering..." : "Register visitor"}
      </button>
    </form>
  );
}
