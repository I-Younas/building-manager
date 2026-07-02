"use client";

import { useActionState, useState } from "react";
import { createInviteCode } from "@/lib/actions/invites";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function StaffInviteForm() {
  const [state, formAction, pending] = useActionState(createInviteCode, undefined);
  const [email, setEmail] = useState("");

  const inviteLink = state && "code" in state ? `/invite/${state.code}` : null;
  const emailSent = state && "code" in state ? state.emailSent : false;
  const error = state && "error" in state ? state.error : null;

  return (
    <form action={formAction} className={formStackClasses}>
      <input type="hidden" name="role" value="STAFF" />

      <label className={labelClasses}>
        Email
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
        />
      </label>

      <label className={labelClasses}>
        Employee ID (optional)
        <input name="employeeId" maxLength={50} className={inputClasses} />
      </label>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending..." : "Send invite link"}
      </Button>

      {inviteLink && emailSent ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Invite sent to <strong>{email}</strong>. The link expires in 7 days.
        </div>
      ) : null}

      {inviteLink && !emailSent ? (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          The invite was created, but the email couldn&apos;t be sent automatically. Share this link with{" "}
          {email} manually (it expires in 7 days):
          <br />
          <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-amber-700">{inviteLink}</code>
        </div>
      ) : null}
    </form>
  );
}
