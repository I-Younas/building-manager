"use client";

import { useActionState } from "react";
import { recordPayment } from "@/lib/actions/payments";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState(recordPayment.bind(null, invoiceId), undefined);

  return (
    <form action={formAction} className={`${formStackClasses} max-w-sm`}>
      <label className={labelClasses}>
        Amount
        <input name="amount" required inputMode="decimal" placeholder="e.g. 50.00" className={inputClasses} />
      </label>
      <label className={labelClasses}>
        Method
        <select name="method" defaultValue="BANK_TRANSFER" className={inputClasses}>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="CHEQUE">Cheque</option>
          <option value="CARD">Card</option>
          <option value="ONLINE">Online</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label className={labelClasses}>
        Date paid
        <input type="date" name="paidAt" required className={inputClasses} />
      </label>
      <label className={labelClasses}>
        Reference (optional)
        <input name="reference" maxLength={200} className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Recording..." : "Record payment"}
      </Button>
    </form>
  );
}
