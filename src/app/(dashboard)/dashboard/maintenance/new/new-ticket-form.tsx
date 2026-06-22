"use client";

import { useActionState } from "react";
import { createTicket } from "@/lib/actions/maintenance";

type Unit = { id: string; unitNumber: string; buildingName: string };

export function NewTicketForm({ units }: { units: Unit[] }) {
  const [state, formAction, pending] = useActionState(createTicket, undefined);

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
        Title
        <input name="title" required maxLength={200} />
      </label>

      <label>
        Description
        <textarea name="description" required maxLength={5000} rows={5} />
      </label>

      <label>
        Category (optional)
        <input name="category" maxLength={100} placeholder="e.g. Plumbing" />
      </label>

      <label>
        Priority
        <select name="priority" defaultValue="MEDIUM">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
