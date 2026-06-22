"use client";

import { useActionState } from "react";
import { decideBooking } from "@/lib/actions/bookings";
import { Button, ErrorText, inputClasses } from "@/components/ui";

export function DecisionForms({ bookingId }: { bookingId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(
    decideBooking.bind(null, bookingId, "APPROVE"),
    undefined,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    decideBooking.bind(null, bookingId, "REJECT"),
    undefined,
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={approveAction} className="flex gap-2">
        <input name="note" placeholder="Note (optional)" className={`${inputClasses} mt-0`} />
        <Button type="submit" disabled={approvePending} size="sm">
          {approvePending ? "Approving..." : "Approve"}
        </Button>
      </form>
      <form action={rejectAction} className="flex gap-2">
        <input name="note" placeholder="Reason (optional)" className={`${inputClasses} mt-0`} />
        <Button type="submit" disabled={rejectPending} variant="danger" size="sm">
          {rejectPending ? "Rejecting..." : "Reject"}
        </Button>
      </form>
      {approveState?.error ? <ErrorText>{approveState.error}</ErrorText> : null}
      {rejectState?.error ? <ErrorText>{rejectState.error}</ErrorText> : null}
    </div>
  );
}
