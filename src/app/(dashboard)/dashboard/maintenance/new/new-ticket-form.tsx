"use client";

import { useActionState } from "react";
import { createTicket } from "@/lib/actions/maintenance";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

type Unit = { id: string; unitNumber: string; buildingName: string };

export function NewTicketForm({ units }: { units: Unit[] }) {
  const [state, formAction, pending] = useActionState(createTicket, undefined);

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
        Title
        <input name="title" required maxLength={200} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Description
        <textarea name="description" required maxLength={5000} rows={5} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Category (optional)
        <input name="category" maxLength={100} placeholder="e.g. Plumbing" className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Priority
        <select name="priority" defaultValue="MEDIUM" className={inputClasses}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
