"use client";

import { useActionState, useState } from "react";
import type { FormActionState } from "@/lib/actions/announcements";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

type Action = (state: FormActionState, formData: FormData) => Promise<FormActionState>;
type Building = { id: string; name: string };

export function AnnouncementForm({
  action,
  buildings,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  buildings: Building[];
  defaultValues?: {
    title: string;
    body: string;
    scope: "ORGANIZATION" | "BUILDING";
    buildingId: string | null;
    expiresAt: Date | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [scope, setScope] = useState<"ORGANIZATION" | "BUILDING">(defaultValues?.scope ?? "ORGANIZATION");

  return (
    <form action={formAction} className={`${formStackClasses} max-w-2xl`}>
      <label className={labelClasses}>
        Title
        <input name="title" required maxLength={200} defaultValue={defaultValues?.title} className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Body
        <textarea
          name="body"
          required
          maxLength={5000}
          rows={5}
          defaultValue={defaultValues?.body}
          className={inputClasses}
        />
      </label>

      <label className={labelClasses}>
        Scope
        <select
          name="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as "ORGANIZATION" | "BUILDING")}
          className={inputClasses}
        >
          <option value="ORGANIZATION">Entire organization</option>
          <option value="BUILDING">Specific building</option>
        </select>
      </label>

      {scope === "BUILDING" ? (
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
      ) : null}

      <label className={labelClasses}>
        Expires on (optional)
        <input
          type="date"
          name="expiresAt"
          defaultValue={defaultValues?.expiresAt ? defaultValues.expiresAt.toISOString().slice(0, 10) : ""}
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
