"use client";

import { useActionState } from "react";
import { requestBooking } from "@/lib/actions/bookings";

type Facility = { id: string; name: string; buildingName: string };
type Unit = { id: string; unitNumber: string; buildingName: string };

export function BookingForm({
  facilities,
  units,
  defaultFacilityId,
}: {
  facilities: Facility[];
  units: Unit[];
  defaultFacilityId?: string;
}) {
  const [state, formAction, pending] = useActionState(requestBooking, undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <label>
        Facility
        <select name="facilityId" required defaultValue={defaultFacilityId ?? ""}>
          <option value="" disabled>
            Select a facility
          </option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.buildingName} / {facility.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Unit
        <select name="unitId" required defaultValue={units.length === 1 ? units[0].id : ""}>
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
        Start
        <input type="datetime-local" name="startsAt" required />
      </label>

      <label>
        End
        <input type="datetime-local" name="endsAt" required />
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Requesting..." : "Request booking"}
      </button>
    </form>
  );
}
