"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createUnitFromForm } from "@/lib/actions/units";
import { Button, ErrorText, inputClasses, labelClasses } from "@/components/ui";

type Building = { id: string; name: string };

export function AddUnitPanel({ buildings }: { buildings: Building[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUnitFromForm, undefined);
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (wasSubmitting.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasSubmitting.current = pending;
  }, [pending, state]);

  return (
    <div className="flex flex-col items-end gap-3">
      <Button variant={open ? "secondary" : "primary"} onClick={() => setOpen((o) => !o)}>
        {open ? "Cancel" : "Add unit"}
      </Button>

      {open && (
        <form
          action={formAction}
          className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        >
          <label className={labelClasses}>
            Building
            <select name="buildingId" required defaultValue="" className={inputClasses}>
              <option value="" disabled>
                Select a building
              </option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClasses}>
            Unit number
            <input name="unitNumber" required maxLength={50} className={inputClasses} />
          </label>

          <label className={labelClasses}>
            Floor
            <input name="floor" maxLength={50} className={inputClasses} />
          </label>

          <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add unit"}
          </Button>

          {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
        </form>
      )}
    </div>
  );
}
