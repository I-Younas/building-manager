"use client";

import { useActionState, useState } from "react";
import type { FormActionState } from "@/lib/actions/announcements";

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
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
      <label>
        Title
        <input name="title" required maxLength={200} defaultValue={defaultValues?.title} />
      </label>

      <label>
        Body
        <textarea name="body" required maxLength={5000} rows={5} defaultValue={defaultValues?.body} />
      </label>

      <label>
        Scope
        <select
          name="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as "ORGANIZATION" | "BUILDING")}
        >
          <option value="ORGANIZATION">Entire organization</option>
          <option value="BUILDING">Specific building</option>
        </select>
      </label>

      {scope === "BUILDING" ? (
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
      ) : null}

      <label>
        Expires on (optional)
        <input
          type="date"
          name="expiresAt"
          defaultValue={defaultValues?.expiresAt ? defaultValues.expiresAt.toISOString().slice(0, 10) : ""}
        />
      </label>

      {state?.error ? <p role="alert">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
