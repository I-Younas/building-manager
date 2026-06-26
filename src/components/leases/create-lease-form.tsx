"use client";

import { useActionState } from "react";
import { createLease } from "@/lib/actions/leases";
import { Button, ErrorText, inputClasses, labelClasses } from "@/components/ui";

export function CreateLeaseForm({ unitResidentId }: { unitResidentId: string }) {
  const [state, formAction, pending] = useActionState(createLease.bind(null, unitResidentId), undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className={`${labelClasses} mt-0`}>
        Lease start
        <input type="date" name="leaseStartDate" required className={inputClasses} />
      </label>
      <label className={`${labelClasses} mt-0`}>
        Lease end
        <input type="date" name="leaseEndDate" required className={inputClasses} />
      </label>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving..." : "Confirm lease"}
      </Button>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
