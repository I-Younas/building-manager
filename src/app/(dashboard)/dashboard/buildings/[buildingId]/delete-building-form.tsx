"use client";

import { useActionState, useState } from "react";
import { deleteBuilding, type DeleteBuildingState } from "@/lib/actions/buildings";
import { Button, ErrorText, inputClasses, labelClasses } from "@/components/ui";

export function DeleteBuildingForm({
  buildingId,
  buildingName,
  unitCount,
  residentCount,
}: {
  buildingId: string;
  buildingName: string;
  unitCount: number;
  residentCount: number;
}) {
  const [state, formAction, pending] = useActionState<DeleteBuildingState, FormData>(
    deleteBuilding.bind(null, buildingId),
    undefined,
  );
  const [confirmText, setConfirmText] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        This permanently deletes <strong>{buildingName}</strong>, its {unitCount} unit{unitCount === 1 ? "" : "s"}, and
        all linked tickets, invoices, and resident assignments ({residentCount} resident
        {residentCount === 1 ? "" : "s"} affected). This can&apos;t be undone.
      </p>
      <label className={labelClasses}>
        Type <strong>{buildingName}</strong> to confirm
        <input
          name="confirmName"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className={inputClasses}
        />
      </label>
      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
      <Button type="submit" variant="danger" disabled={pending || confirmText !== buildingName} className="self-start">
        {pending ? "Deleting..." : "Delete building"}
      </Button>
    </form>
  );
}
