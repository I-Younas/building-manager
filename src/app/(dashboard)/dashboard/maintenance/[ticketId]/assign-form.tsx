"use client";

import { useActionState } from "react";
import { assignTicket } from "@/lib/actions/maintenance";
import { Button, ErrorText, inputClasses, labelClasses } from "@/components/ui";

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
    <form action={formAction} className="flex flex-col gap-3">
      <label className={labelClasses}>
        Assignee
        <select name="assigneeUserId" defaultValue={currentAssigneeId ?? ""} className={inputClasses}>
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={pending} size="sm" className="self-start">
        {pending ? "Saving..." : "Save assignment"}
      </Button>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
