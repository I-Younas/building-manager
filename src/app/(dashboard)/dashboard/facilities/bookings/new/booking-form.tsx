"use client";

import { useActionState } from "react";
import { requestBooking } from "@/lib/actions/bookings";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

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
    <form action={formAction} className={`${formStackClasses} max-w-lg`}>
      <label className={labelClasses}>
        Facility
        <select name="facilityId" required defaultValue={defaultFacilityId ?? ""} className={inputClasses}>
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

      <label className={labelClasses}>
        Unit
        <select name="unitId" required defaultValue={units.length === 1 ? units[0].id : ""} className={inputClasses}>
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
        Start
        <input type="datetime-local" name="startsAt" required className={inputClasses} />
      </label>

      <label className={labelClasses}>
        End
        <input type="datetime-local" name="endsAt" required className={inputClasses} />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Requesting..." : "Request booking"}
      </Button>
    </form>
  );
}
