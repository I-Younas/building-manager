"use client";

import { useActionState, useState } from "react";
import { createInviteCode } from "@/lib/actions/invites";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

type Unit = { id: string; unitNumber: string; buildingName: string };

export function InviteForm({ units, defaultUnitId }: { units: Unit[]; defaultUnitId?: string }) {
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
            Unit
            <select name="unitId" defaultValue={defaultUnitId ?? ""} required className={inputClasses}>
              <option value="" disabled>
                Select a unit
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.buildingName} / Unit {unit.unitNumber}
                </option>
              ))}
            </select>
          </label>

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
        Lock to a specific email (optional)
        <input name="email" type="email" className={inputClasses} />
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
