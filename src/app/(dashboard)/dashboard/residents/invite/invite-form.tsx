"use client";

import { useActionState, useState } from "react";
import { createInviteCode } from "@/lib/actions/invites";

type Unit = { id: string; unitNumber: string; buildingName: string };

export function InviteForm({ units, defaultUnitId }: { units: Unit[]; defaultUnitId?: string }) {
  const [state, formAction, pending] = useActionState(createInviteCode, undefined);
  const [role, setRole] = useState<"RESIDENT" | "STAFF">("RESIDENT");

  const inviteLink = state && "code" in state ? `/invite/${state.code}` : null;
  const error = state && "error" in state ? state.error : null;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <label>
        Role
        <select name="role" value={role} onChange={(e) => setRole(e.target.value as "RESIDENT" | "STAFF")}>
          <option value="RESIDENT">Resident</option>
          <option value="STAFF">Staff</option>
        </select>
      </label>

      {role === "RESIDENT" ? (
        <>
          <label>
            Unit
            <select name="unitId" defaultValue={defaultUnitId ?? ""} required>
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

          <label>
            Relationship
            <select name="relationship" required defaultValue="OWNER">
              <option value="OWNER">Owner</option>
              <option value="TENANT">Tenant</option>
              <option value="FAMILY_MEMBER">Family member</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
        </>
      ) : null}

      <label>
        Lock to a specific email (optional)
        <input name="email" type="email" />
      </label>

      {error ? <p role="alert">{error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Generating..." : "Generate invite link"}
      </button>

      {inviteLink ? (
        <p>
          Share this link with the invitee (it expires in 7 days):
          <br />
          <code>{inviteLink}</code>
        </p>
      ) : null}
    </form>
  );
}
