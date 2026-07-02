"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createUnit } from "@/lib/actions/units";
import { Button, ErrorText, inputClasses, labelClasses, tdClasses, trClasses } from "@/components/ui";

type Props = {
  building: { id: string; name: string };
  unitCount: number;
  rented: number;
  vacant: number;
  pending: number;
  pendingLabel: string;
  rentedHref: string;
  vacantHref: string;
  pendingHref: string;
};

export function AddUnitRow({
  building,
  unitCount,
  rented,
  vacant,
  pending,
  pendingLabel,
  rentedHref,
  vacantHref,
  pendingHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, submitting] = useActionState(
    createUnit.bind(null, building.id),
    undefined,
  );
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (wasSubmitting.current && !submitting && !state?.error) {
      setOpen(false);
    }
    wasSubmitting.current = submitting;
  }, [submitting, state]);

  return (
    <>
      <tr className={trClasses}>
        <td className={tdClasses}>
          <Link
            href={`/dashboard/buildings/${building.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {building.name}
          </Link>
        </td>
        <td className={tdClasses}>{unitCount}</td>
        <td className={tdClasses}>
          <Link href={rentedHref} className="text-blue-600 hover:underline">
            {rented}
          </Link>
        </td>
        <td className={tdClasses}>
          <Link href={vacantHref} className="text-blue-600 hover:underline">
            {vacant}
          </Link>
          {pending > 0 ? (
            <Link
              href={pendingHref}
              className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
            >
              {pending} {pendingLabel}
            </Link>
          ) : null}
        </td>
        <td className={tdClasses}>
          <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
            {open ? "Cancel" : "Add unit"}
          </Button>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={5} className="bg-slate-50 px-4 py-3">
            <form action={formAction} className="flex flex-wrap items-end gap-3">
              <label className={labelClasses}>
                Unit number
                <input name="unitNumber" required maxLength={50} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                Floor
                <input name="floor" maxLength={50} className={inputClasses} />
              </label>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Adding..." : "Add unit"}
              </Button>
              {state?.error ? <ErrorText>{state.error}</ErrorText> : null}
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
