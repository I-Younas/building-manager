"use client";

import { useActionState, useState } from "react";
import { createInviteCode } from "@/lib/actions/invites";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

type Building = { id: string; name: string };

export function InviteForm({ buildings }: { buildings: Building[] }) {
  const [state, formAction, pending] = useActionState(createInviteCode, undefined);
  const [email, setEmail] = useState("");

  const success = state && "code" in state ? state : null;
  const inviteLink = success ? `/invite/${success.code}` : null;
  const error = state && "error" in state ? state.error : null;

  return (
    <form action={formAction} className={formStackClasses}>
      <input type="hidden" name="role" value="RESIDENT" />

      <label className={labelClasses}>
        Building
        <select name="buildingId" required defaultValue="" className={inputClasses}>
          <option value="" disabled>
            Select a building
          </option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClasses}>
        Unit number
        <input
          name="unitNumber"
          required
          maxLength={20}
          placeholder="e.g. 101, 2A"
          className={inputClasses}
        />
      </label>

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

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending..." : "Send invite link"}
      </Button>

      {inviteLink && success?.emailSent ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Invite sent to <strong>{email}</strong>. The link expires in 7 days.
        </div>
      ) : null}

      {inviteLink && !success?.emailSent ? (
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
