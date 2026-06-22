"use client";

import { useActionState } from "react";
import { updateTicketStatus } from "@/lib/actions/maintenance";
import { Button, ErrorText, inputClasses, labelClasses } from "@/components/ui";

const STATUSES = ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"] as const;

export function StatusForm({ ticketId, currentStatus }: { ticketId: string; currentStatus: string }) {
  const [state, formAction, pending] = useActionState(updateTicketStatus.bind(null, ticketId), undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className={labelClasses}>
        Status
        <select name="status" defaultValue={currentStatus} className={inputClasses}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClasses}>
        Note (optional)
        <input name="note" maxLength={2000} className={inputClasses} />
      </label>
      <Button type="submit" disabled={pending} size="sm" className="self-start">
        {pending ? "Updating..." : "Update status"}
      </Button>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
