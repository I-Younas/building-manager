"use client";

import { useActionState } from "react";
import { confirmRenewal } from "@/lib/actions/leases";
import { Button, ErrorText, inputClasses, labelClasses } from "@/components/ui";

export function ConfirmRenewalForm({ leaseId }: { leaseId: string }) {
  const [state, formAction, pending] = useActionState(confirmRenewal.bind(null, leaseId), undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className={`${labelClasses} mt-0`}>
        New lease start
        <input type="date" name="leaseStartDate" required className={inputClasses} />
      </label>
      <label className={`${labelClasses} mt-0`}>
        New lease end
        <input type="date" name="leaseEndDate" required className={inputClasses} />
      </label>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving..." : "Confirm renewal"}
      </Button>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
