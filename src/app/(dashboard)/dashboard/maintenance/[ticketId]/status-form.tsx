"use client";

import { useActionState } from "react";
import { updateTicketStatus } from "@/lib/actions/maintenance";

const STATUSES = ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"] as const;

export function StatusForm({ ticketId, currentStatus }: { ticketId: string; currentStatus: string }) {
  const [state, formAction, pending] = useActionState(updateTicketStatus.bind(null, ticketId), undefined);

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
      <label>
        Status
        <select name="status" defaultValue={currentStatus}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label>
        Note (optional)
        <input name="note" maxLength={2000} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Updating..." : "Update status"}
      </button>
      {state?.error ? <p role="alert">{state.error}</p> : null}
    </form>
  );
}
