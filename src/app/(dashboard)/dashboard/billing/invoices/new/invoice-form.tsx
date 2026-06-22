"use client";

import { useActionState, useState } from "react";
import { createInvoice } from "@/lib/actions/invoices";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

type Unit = { id: string; unitNumber: string; buildingName: string };

export function InvoiceForm({ units }: { units: Unit[] }) {
  const [state, formAction, pending] = useActionState(createInvoice, undefined);
  const [rowIds, setRowIds] = useState([0]);
  const [nextId, setNextId] = useState(1);

  function addRow() {
    setRowIds((ids) => [...ids, nextId]);
    setNextId((id) => id + 1);
  }

  function removeRow(id: number) {
    setRowIds((ids) => (ids.length > 1 ? ids.filter((rowId) => rowId !== id) : ids));
  }

  return (
    <form action={formAction} className={`${formStackClasses} max-w-2xl`}>
      <label className={labelClasses}>
        Unit
        <select name="unitId" required defaultValue="" className={inputClasses}>
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
        Due date
        <input type="date" name="dueDate" required className={inputClasses} />
      </label>

      <fieldset className="flex flex-col gap-2 rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Line items</legend>
        {rowIds.map((id) => (
          <div key={id} className="flex gap-2">
            <input name="description" placeholder="Description" className={`${inputClasses} mt-0 flex-[2]`} />
            <input
              name="amount"
              placeholder="Amount (e.g. 25.00)"
              inputMode="decimal"
              className={`${inputClasses} mt-0 flex-1`}
            />
            <input
              name="quantity"
              placeholder="Qty"
              defaultValue="1"
              inputMode="numeric"
              className={`${inputClasses} mt-0 w-16`}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => removeRow(id)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" className="self-start" onClick={addRow}>
          Add line item
        </Button>
      </fieldset>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating..." : "Create invoice (draft)"}
      </Button>
    </form>
  );
}
