"use client";

import { useActionState, useState } from "react";
import { createInviteCode } from "@/lib/actions/invites";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export function InviteForm({
  defaultBuildingName,
  defaultUnitNumber,
}: {
  defaultBuildingName?: string;
  defaultUnitNumber?: string;
}) {
  const [state, formAction, pending] = useActionState(createInviteCode, undefined);
  const [role, setRole] = useState<"RESIDENT" | "STAFF">("RESIDENT");

  const inviteLink = state && "code" in state ? `/invite/${state.code}` : null;
  const error = state && "error" in state ? state.error : null;

  return (
    <form action={formAction} className={formStackClasses}>
      <label className={labelClasses}>
        Role
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "RESIDENT" | "STAFF")}
          className={inputClasses}
        >
          <option value="RESIDENT">Resident</option>
          <option value="STAFF">Staff</option>
        </select>
      </label>

      {role === "RESIDENT" ? (
        <>
          <label className={labelClasses}>
            Building
            <input
              name="buildingName"
              required
              maxLength={200}
              placeholder="e.g. Maple Towers"
              defaultValue={defaultBuildingName ?? ""}
              className={inputClasses}
            />
          </label>

          <label className={labelClasses}>
            Unit number
            <input
              name="unitNumber"
              required
              maxLength={50}
              placeholder="e.g. 101"
              defaultValue={defaultUnitNumber ?? ""}
              className={inputClasses}
            />
          </label>
          <p className="text-xs text-slate-500">
            If this building or unit doesn&apos;t exist yet, it will be created automatically.
          </p>

          <label className={labelClasses}>
            Relationship
            <select name="relationship" required defaultValue="OWNER" className={inputClasses}>
              <option value="OWNER">Owner</option>
              <option value="TENANT">Tenant</option>
              <option value="FAMILY_MEMBER">Family member</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
        </>
      ) : null}

      <label className={labelClasses}>
        Email
        <input name="email" type="email" required className={inputClasses} />
      </label>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Generating..." : "Generate invite link"}
      </Button>

      {inviteLink ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Share this link with the invitee (it expires in 7 days):
          <br />
          <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-emerald-700">{inviteLink}</code>
        </div>
      ) : null}
    </form>
  );
}
