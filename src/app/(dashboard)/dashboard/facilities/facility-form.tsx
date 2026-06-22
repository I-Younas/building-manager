"use client";

import { useActionState } from "react";
import type { FormActionState } from "@/lib/actions/facilities";

type Action = (state: FormActionState, formData: FormData) => Promise<FormActionState>;
type Building = { id: string; name: string };

export function FacilityForm({
  action,
  buildings,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  buildings: Building[];
  defaultValues?: {
    buildingId: string;
    name: string;
    description: string | null;
    requiresApproval: boolean;
    openTime: string;
    closeTime: string;
    minNoticeHours: number;
    maxDurationMinutes: number;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <label>
        Building
        <select name="buildingId" required defaultValue={defaultValues?.buildingId ?? ""}>
          <option value="" disabled>
            Select a building
          </option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Name
        <input name="name" required maxLength={200} defaultValue={defaultValues?.name} />
      </label>

      <label>
        Description (optional)
        <textarea name="description" maxLength={2000} rows={3} defaultValue={defaultValues?.description ?? ""} />
      </label>

      <label>
        <input type="checkbox" name="requiresApproval" defaultChecked={defaultValues?.requiresApproval ?? true} />{" "}
        Requires admin approval
      </label>

      <label>
        Opening time
        <input type="time" name="openTime" required defaultValue={defaultValues?.openTime ?? "08:00"} />
      </label>

      <label>
        Closing time
        <input type="time" name="closeTime" required defaultValue={defaultValues?.closeTime ?? "22:00"} />
      </label>

      <label>
        Minimum notice (hours)
        <input
          type="number"
          name="minNoticeHours"
          required
          min={0}
          max={720}
          defaultValue={defaultValues?.minNoticeHours ?? 24}
        />
      </label>

      <label>
        Maximum booking duration (minutes)
        <input
          type="number"
          name="maxDurationMinutes"
          required
          min={15}
          max={1440}
          defaultValue={defaultValues?.maxDurationMinutes ?? 120}
        />
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
