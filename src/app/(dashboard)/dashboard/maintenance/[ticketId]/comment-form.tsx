"use client";

import { useActionState } from "react";
import { addTicketComment } from "@/lib/actions/maintenance";
import { Button, checkboxClasses, ErrorText, inputClasses, labelClasses } from "@/components/ui";

export function CommentForm({ ticketId, canMarkInternal }: { ticketId: string; canMarkInternal: boolean }) {
  const [state, formAction, pending] = useActionState(addTicketComment.bind(null, ticketId), undefined);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <label className={labelClasses}>
        Add a comment
        <textarea name="body" required maxLength={5000} rows={3} className={inputClasses} />
      </label>
      {canMarkInternal ? (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isInternal" className={checkboxClasses} /> Internal note (staff only)
        </label>
      ) : null}
      <Button type="submit" disabled={pending} size="sm" className="self-start">
        {pending ? "Posting..." : "Post comment"}
      </Button>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
