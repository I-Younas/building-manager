"use client";

import { useActionState } from "react";
import { updateLease } from "@/lib/actions/units";
import { Button, ErrorText, inputClasses, labelClasses } from "@/components/ui";

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function LeaseForm({
  unitResidentId,
  leaseStartDate,
  leaseEndDate,
  renewalSigned,
}: {
  unitResidentId: string;
  leaseStartDate: Date | null;
  leaseEndDate: Date | null;
  renewalSigned: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateLease.bind(null, unitResidentId), undefined);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
      <label className={`${labelClasses} mt-0`}>
        Lease start
        <input
          type="date"
          name="leaseStartDate"
          defaultValue={toDateInputValue(leaseStartDate)}
          className={inputClasses}
        />
      </label>
      <label className={`${labelClasses} mt-0`}>
        Lease end
        <input
          type="date"
          name="leaseEndDate"
          defaultValue={toDateInputValue(leaseEndDate)}
          className={inputClasses}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="renewalSigned" defaultChecked={renewalSigned} />
        Renewal signed
      </label>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving..." : "Save lease"}
      </Button>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
