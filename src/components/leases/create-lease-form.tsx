"use client";

import { useActionState, useState } from "react";
import { createLease } from "@/lib/actions/leases";
import { DatePicker } from "@/components/date-picker";
import { Button, ErrorText, labelClasses } from "@/components/ui";

export function CreateLeaseForm({ unitResidentId }: { unitResidentId: string }) {
  const [state, formAction, pending] = useActionState(createLease.bind(null, unitResidentId), undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth();

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="leaseStartDate" value={startDate} />
      <input type="hidden" name="leaseEndDate" value={endDate} />

      <label className={`${labelClasses} mt-0`}>
        Lease start
        <DatePicker
          name="_leaseStartDate"
          startYear={thisYear - 1}
          startMonth={thisMonth}
          maxYear={thisYear + 10}
          onChange={setStartDate}
        />
      </label>
      <label className={`${labelClasses} mt-0`}>
        Lease end
        <DatePicker
          name="_leaseEndDate"
          startYear={thisYear}
          startMonth={thisMonth}
          maxYear={thisYear + 10}
          upward
          onChange={setEndDate}
        />
      </label>
      <Button type="submit" disabled={pending || !startDate || !endDate} size="sm">
        {pending ? "Saving..." : "Confirm lease"}
      </Button>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
