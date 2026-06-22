"use client";

import { useActionState } from "react";
import { recordPayment } from "@/lib/actions/payments";

export function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState(recordPayment.bind(null, invoiceId), undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
      <label>
        Amount
        <input name="amount" required inputMode="decimal" placeholder="e.g. 50.00" />
      </label>
      <label>
        Method
        <select name="method" defaultValue="BANK_TRANSFER">
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="CHEQUE">Cheque</option>
          <option value="CARD">Card</option>
          <option value="ONLINE">Online</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label>
        Date paid
        <input type="date" name="paidAt" required />
      </label>
      <label>
        Reference (optional)
        <input name="reference" maxLength={200} />
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Recording..." : "Record payment"}
      </button>
    </form>
  );
}
