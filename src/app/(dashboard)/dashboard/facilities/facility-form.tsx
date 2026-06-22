"use client";

import { useActionState } from "react";
import type { FormActionState } from "@/lib/actions/facilities";
import { Button, checkboxClasses, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

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
    <form action={formAction} className={`${formStackClasses} max-w-lg`}>
      <label className={labelClasses}>
        Building
        <select name="buildingId" required defaultValue={defaultValues?.buildingId ?? ""} className={inputClasses}>
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

      <label className={labelClasses}>
        Name
        <input name="name" required maxLength={200} defaultValue={defaultValues?.name} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Description (optional)
        <textarea
          name="description"
          maxLength={2000}
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className={inputClasses}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="requiresApproval"
          defaultChecked={defaultValues?.requiresApproval ?? true}
          className={checkboxClasses}
        />
        Requires admin approval
      </label>

      <label className={labelClasses}>
        Opening time
        <input
          type="time"
          name="openTime"
          required
          defaultValue={defaultValues?.openTime ?? "08:00"}
          className={inputClasses}
        />
      </label>

      <label className={labelClasses}>
        Closing time
        <input
          type="time"
          name="closeTime"
          required
          defaultValue={defaultValues?.closeTime ?? "22:00"}
          className={inputClasses}
        />
      </label>

      <label className={labelClasses}>
        Minimum notice (hours)
        <input
          type="number"
          name="minNoticeHours"
          required
          min={0}
          max={720}
          defaultValue={defaultValues?.minNoticeHours ?? 24}
          className={inputClasses}
        />
      </label>

      <label className={labelClasses}>
        Maximum booking duration (minutes)
        <input
          type="number"
          name="maxDurationMinutes"
          required
          min={15}
          max={1440}
          defaultValue={defaultValues?.maxDurationMinutes ?? 120}
          className={inputClasses}
        />
      </label>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
