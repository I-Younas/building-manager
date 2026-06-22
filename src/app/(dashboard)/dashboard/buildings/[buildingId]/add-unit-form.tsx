"use client";

import { useActionState } from "react";
import { createUnit } from "@/lib/actions/units";

export function AddUnitForm({ buildingId }: { buildingId: string }) {
  const [state, formAction, pending] = useActionState(createUnit.bind(null, buildingId), undefined);

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
      <label>
        Unit number
        <input name="unitNumber" required maxLength={50} />
      </label>
      <label>
        Floor
        <input name="floor" maxLength={50} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add unit"}
      </button>
      {state?.error ? <p role="alert">{state.error}</p> : null}
    </form>
  );
}
