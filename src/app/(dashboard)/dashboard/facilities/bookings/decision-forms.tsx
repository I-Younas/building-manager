"use client";

import { useActionState } from "react";
import { decideBooking } from "@/lib/actions/bookings";

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
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <form action={approveAction} style={{ display: "flex", gap: 8 }}>
        <input name="note" placeholder="Note (optional)" />
        <button type="submit" disabled={approvePending}>
          {approvePending ? "Approving..." : "Approve"}
        </button>
      </form>
      <form action={rejectAction} style={{ display: "flex", gap: 8 }}>
        <input name="note" placeholder="Reason (optional)" />
        <button type="submit" disabled={rejectPending}>
          {rejectPending ? "Rejecting..." : "Reject"}
        </button>
      </form>
      {approveState?.error ? <p role="alert">{approveState.error}</p> : null}
      {rejectState?.error ? <p role="alert">{rejectState.error}</p> : null}
    </div>
  );
}
