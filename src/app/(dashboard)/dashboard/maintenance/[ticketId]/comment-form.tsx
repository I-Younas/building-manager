"use client";

import { useActionState } from "react";
import { addTicketComment } from "@/lib/actions/maintenance";

export function CommentForm({ ticketId, canMarkInternal }: { ticketId: string; canMarkInternal: boolean }) {
  const [state, formAction, pending] = useActionState(addTicketComment.bind(null, ticketId), undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480 }}>
      <label>
        Add a comment
        <textarea name="body" required maxLength={5000} rows={3} />
      </label>
      {canMarkInternal ? (
        <label>
          <input type="checkbox" name="isInternal" /> Internal note (staff only)
        </label>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? "Posting..." : "Post comment"}
      </button>
      {state?.error ? <p role="alert">{state.error}</p> : null}
    </form>
  );
}
