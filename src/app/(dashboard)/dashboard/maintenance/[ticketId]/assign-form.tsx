"use client";

import { useActionState } from "react";
import { assignTicket } from "@/lib/actions/maintenance";

export function AssignForm({
  ticketId,
  staff,
  currentAssigneeId,
}: {
  ticketId: string;
  staff: { id: string; name: string }[];
  currentAssigneeId: string | null;
}) {
  const [state, formAction, pending] = useActionState(assignTicket.bind(null, ticketId), undefined);

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <label>
        Assignee
        <select name="assigneeUserId" defaultValue={currentAssigneeId ?? ""}>
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save assignment"}
      </button>
      {state?.error ? <p role="alert">{state.error}</p> : null}
    </form>
  );
}
