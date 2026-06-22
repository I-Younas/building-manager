"use client";

import { useActionState, useState } from "react";
import { createInvoice } from "@/lib/actions/invoices";

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
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
      <label>
        Unit
        <select name="unitId" required defaultValue="">
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
        Due date
        <input type="date" name="dueDate" required />
      </label>

      <fieldset style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <legend>Line items</legend>
        {rowIds.map((id) => (
          <div key={id} style={{ display: "flex", gap: 8 }}>
            <input name="description" placeholder="Description" style={{ flex: 2 }} />
            <input name="amount" placeholder="Amount (e.g. 25.00)" inputMode="decimal" style={{ flex: 1 }} />
            <input name="quantity" placeholder="Qty" defaultValue="1" inputMode="numeric" style={{ width: 60 }} />
            <button type="button" onClick={() => removeRow(id)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow}>
          Add line item
        </button>
      </fieldset>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create invoice (draft)"}
      </button>
    </form>
  );
}
