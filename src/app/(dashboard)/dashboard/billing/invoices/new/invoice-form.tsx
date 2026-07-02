"use client";

import { useActionState, useState } from "react";
import { createInvoice } from "@/lib/actions/invoices";
import { dollarsToCents, formatCents } from "@/lib/money";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";
import { DatePicker } from "@/components/date-picker";

type Unit = { id: string; unitNumber: string; buildingName: string };
type Staff = { id: string; name: string };

export function InvoiceForm({ units, staff }: { units: Unit[]; staff: Staff[] }) {
  const [state, formAction, pending] = useActionState(createInvoice, undefined);
  const [type, setType] = useState<"RENT" | "SERVICE">("RENT");
  const [recurrence, setRecurrence] = useState("NONE");
  const [recurrenceStartAt, setRecurrenceStartAt] = useState("");
  const [recurrenceEndsAt, setRecurrenceEndsAt] = useState("");
  const [rowIds, setRowIds] = useState([0]);
  const [nextId, setNextId] = useState(1);
  const [rowAmounts, setRowAmounts] = useState<Record<number, string>>({ 0: "" });

  function addRow() {
    const id = nextId;
    setRowIds((ids) => [...ids, id]);
    setRowAmounts((vals) => ({ ...vals, [id]: "" }));
    setNextId((n) => n + 1);
  }

  function removeRow(id: number) {
    if (rowIds.length <= 1) return;
    setRowIds((ids) => ids.filter((r) => r !== id));
    setRowAmounts((vals) => {
      const next = { ...vals };
      delete next[id];
      return next;
    });
  }

  function lineTotal(id: number): number | null {
    const cents = dollarsToCents(rowAmounts[id] ?? "");
    return cents !== null && cents > 0 ? cents : null;
  }

  const subtotalCents = rowIds.reduce((sum, id) => {
    const t = lineTotal(id);
    return t !== null ? sum + t : sum;
  }, 0);

  return (
    <form action={formAction} className={`${formStackClasses} max-w-2xl`}>
      <label className={labelClasses}>
        Invoice type
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "RENT" | "SERVICE")}
          className={inputClasses}
        >
          <option value="RENT">Rent (resident)</option>
          <option value="SERVICE">Service (staff)</option>
        </select>
      </label>

      {type === "RENT" ? (
        <>
          <label className={labelClasses}>
            Unit
            <select name="unitId" required defaultValue="" className={inputClasses}>
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

          <div className="flex gap-3">
            <label className={`${labelClasses} flex-1`}>
              Rent period start
              <DatePicker name="rentPeriodStart" startYear={new Date().getFullYear()} startMonth={new Date().getMonth()} maxYear={new Date().getFullYear() + 5} />
            </label>
            <label className={`${labelClasses} flex-1`}>
              Rent period end
              <DatePicker name="rentPeriodEnd" startYear={new Date().getFullYear()} startMonth={new Date().getMonth()} maxYear={new Date().getFullYear() + 5} />
            </label>
          </div>
        </>
      ) : (
        <>
          <label className={labelClasses}>
            Staff member
            <select name="billedToUserId" required defaultValue="" className={inputClasses}>
              <option value="" disabled>
                Select a staff member
              </option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClasses}>
            Service description
            <textarea
              name="serviceDescription"
              required
              maxLength={2000}
              rows={3}
              placeholder="Description of work completed"
              className={inputClasses}
            />
          </label>

          <div className="flex gap-3">
            <label className={`${labelClasses} flex-1`}>
              Service period start
              <DatePicker name="servicePeriodStart" startYear={new Date().getFullYear()} startMonth={new Date().getMonth()} maxYear={new Date().getFullYear() + 5} />
            </label>
            <label className={`${labelClasses} flex-1`}>
              Service period end
              <DatePicker name="servicePeriodEnd" startYear={new Date().getFullYear()} startMonth={new Date().getMonth()} maxYear={new Date().getFullYear() + 5} />
            </label>
          </div>
        </>
      )}

      <label className={labelClasses}>
        Due date
        <DatePicker name="dueDate" startYear={new Date().getFullYear()} startMonth={new Date().getMonth()} maxYear={new Date().getFullYear() + 5} upward />
      </label>

      <div className="flex flex-col gap-3">
        <label className={labelClasses}>
          Recurrence
          <select
            name="recurrence"
            value={recurrence}
            onChange={(e) => { setRecurrence(e.target.value); setRecurrenceStartAt(""); setRecurrenceEndsAt(""); }}
            className={inputClasses}
          >
            <option value="NONE">Does not repeat</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Every 2 weeks</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly (every 3 months)</option>
            <option value="YEARLY">Yearly</option>
            <option value="CUSTOM">Custom — pick a date</option>
          </select>
        </label>

        {recurrence !== "NONE" ? (
          <>
            <input type="hidden" name="recurrenceStartAt" value={recurrenceStartAt} />
            <input type="hidden" name="recurrenceEndsAt" value={recurrenceEndsAt} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClasses}>
                {recurrence === "CUSTOM" ? "Occurrence date" : "Starting from"}
                <DatePicker
                  name="_recurrenceStartAt"
                  startYear={new Date().getFullYear()}
                  startMonth={new Date().getMonth()}
                  maxYear={new Date().getFullYear() + 5}
                  upward
                  onChange={setRecurrenceStartAt}
                />
              </label>
              {recurrence !== "CUSTOM" ? (
                <label className={labelClasses}>
                  Stop repeating after (optional)
                  <DatePicker
                    name="_recurrenceEndsAt"
                    startYear={new Date().getFullYear()}
                    startMonth={new Date().getMonth()}
                    maxYear={new Date().getFullYear() + 5}
                    upward
                    onChange={setRecurrenceEndsAt}
                  />
                </label>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Line items</legend>

        {rowIds.map((id) => {
          const total = lineTotal(id);
          return (
            <div key={id} className="flex items-start gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <div className="grid items-center gap-x-2 gap-y-2 text-sm font-medium text-slate-600" style={{ gridTemplateColumns: "6rem 1fr" }}>
                  <span>Description</span>
                  <input
                    name="description"
                    className={`${inputClasses} mt-0`}
                  />
                  <span>Amount</span>
                  <input
                    name="amount"
                    inputMode="decimal"
                    value={rowAmounts[id] ?? ""}
                    onChange={(e) => setRowAmounts((v) => ({ ...v, [id]: e.target.value }))}
                    className={`${inputClasses} mt-0`}
                  />
                </div>
                {total !== null && (
                  <div className="text-right text-sm tabular-nums text-slate-500">= {formatCents(total)}</div>
                )}
              </div>

              {/* hidden qty=1 so server action keeps working */}
              <input type="hidden" name="quantity" value="1" />

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeRow(id)}
                disabled={rowIds.length === 1}
                aria-label="Remove line item"
                className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <Button type="button" variant="secondary" size="sm" onClick={addRow}>
            + Add line item
          </Button>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-slate-500">Subtotal</span>
            <span className="tabular-nums font-semibold text-slate-900">
              {subtotalCents > 0 ? formatCents(subtotalCents) : <span className="font-normal text-slate-300">—</span>}
            </span>
          </div>
        </div>
      </fieldset>

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
