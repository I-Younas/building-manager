"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormActionState } from "@/lib/actions/announcements";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  Button,
  ErrorText,
  checkboxClasses,
  formStackClasses,
  inputClasses,
  labelClasses,
} from "@/components/ui";

type Action = (state: FormActionState, formData: FormData) => Promise<FormActionState>;
type Building = { id: string; name: string };
type Unit = { id: string; unitNumber: string; buildingId: string; buildingName: string };
type Floor = { key: string; label: string };
type Resident = { userId: string; name: string; email: string; buildingId: string; unitId: string; floor: string | null };

const CATEGORY_OPTIONS = [
  { value: "GENERAL", label: "General notice", suggestedPriority: "NORMAL" },
  { value: "MAINTENANCE", label: "Maintenance / utility interruption", suggestedPriority: "IMPORTANT" },
  { value: "EMERGENCY", label: "Emergency / safety alert", suggestedPriority: "URGENT" },
  { value: "POLICY", label: "Policy / rule change", suggestedPriority: "IMPORTANT" },
  { value: "EVENT", label: "Event / community update", suggestedPriority: "NORMAL" },
  { value: "BILLING", label: "Billing / payment reminder", suggestedPriority: "NORMAL" },
  { value: "AMENITY", label: "Amenity closure", suggestedPriority: "NORMAL" },
] as const;

export type AnnouncementDefaultValues = {
  title: string;
  body: string;
  category: string;
  priority: string;
  audience: string;
  targetBuildingIds: string[];
  targetUnitIds: string[];
  targetFloors: string[];
  includeUserIds: string[];
  expiresAt: Date | null;
  allowReplies: boolean;
  requireAcknowledgment: boolean;
  acknowledgmentReminderDays: number | null;
  scheduledAt: Date | null;
  recurrence: string;
  recurrenceEndsAt: Date | null;
  correctsAnnouncementId?: string | null;
};

export function AnnouncementForm({
  action,
  buildings,
  units,
  floors,
  residents,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  buildings: Building[];
  units: Unit[];
  floors: Floor[];
  residents: Resident[];
  defaultValues?: AnnouncementDefaultValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [category, setCategory] = useState(defaultValues?.category ?? "GENERAL");
  const [priority, setPriority] = useState(defaultValues?.priority ?? "NORMAL");
  const [audience, setAudience] = useState(defaultValues?.audience ?? "ALL_ORG");
  const [targetBuildingIds, setTargetBuildingIds] = useState<string[]>(defaultValues?.targetBuildingIds ?? []);
  const [targetUnitIds, setTargetUnitIds] = useState<string[]>(defaultValues?.targetUnitIds ?? []);
  const [targetFloors, setTargetFloors] = useState<string[]>(defaultValues?.targetFloors ?? []);
  const [includeUserIds, setIncludeUserIds] = useState<string[]>(defaultValues?.includeUserIds ?? []);
  const [requireAcknowledgment, setRequireAcknowledgment] = useState(defaultValues?.requireAcknowledgment ?? false);
  const [sendTiming, setSendTiming] = useState<"NOW" | "SCHEDULE" | "DRAFT">("NOW");
  const [recurrence, setRecurrence] = useState(defaultValues?.recurrence ?? "NONE");
  const [confirmedLargeSend, setConfirmedLargeSend] = useState(false);
  const [preview, setPreview] = useState(false);
  const [body, setBody] = useState(defaultValues?.body ?? "");

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const recipientCount = useMemo(() => {
    const distinct = new Map<string, Resident>();
    for (const r of residents) {
      let included = false;
      if (audience === "ALL_ORG") included = true;
      else if (audience === "BUILDINGS") included = targetBuildingIds.includes(r.buildingId);
      else if (audience === "UNITS") included = targetUnitIds.includes(r.unitId);
      else if (audience === "FLOORS") included = r.floor !== null && targetFloors.includes(`${r.buildingId}::${r.floor}`);
      else if (audience === "INDIVIDUALS") included = includeUserIds.includes(r.userId);
      if (included) distinct.set(r.userId, r);
    }
    return distinct.size;
  }, [residents, audience, targetBuildingIds, targetUnitIds, targetFloors, includeUserIds]);

  const requiresConfirmation = recipientCount > 20 && !confirmedLargeSend;

  return (
    <form action={formAction} className={`${formStackClasses} max-w-3xl`}>
      <input type="hidden" name="correctsAnnouncementId" value={defaultValues?.correctsAnnouncementId ?? ""} />

      <label className={labelClasses}>
        Title
        <input name="title" required maxLength={200} defaultValue={defaultValues?.title} className={inputClasses} />
      </label>

      <div>
        <span className={labelClasses}>Body</span>
        <RichTextEditor name="body" defaultValue={defaultValues?.body} onChangeHtml={setBody} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClasses}>
          Category
          <select
            name="category"
            value={category}
            onChange={(e) => {
              const next = e.target.value;
              setCategory(next);
              const suggestion = CATEGORY_OPTIONS.find((c) => c.value === next)?.suggestedPriority;
              if (suggestion) setPriority(suggestion);
            }}
            className={inputClasses}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClasses}>
          Priority
          <select name="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClasses}>
            <option value="NORMAL">Normal</option>
            <option value="IMPORTANT">Important</option>
            <option value="URGENT">Urgent / Emergency</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className={labelClasses}>Audience</legend>
        <select name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className={inputClasses}>
          <option value="ALL_ORG">All residents in the organization</option>
          <option value="BUILDINGS">Specific buildings</option>
          <option value="UNITS">Specific units</option>
          <option value="FLOORS">Specific floors</option>
          <option value="INDIVIDUALS">Individual residents only</option>
        </select>

        {audience === "BUILDINGS" ? (
          <div className="mt-2 flex flex-col gap-1 rounded-md border border-slate-200 p-3">
            {buildings.map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="targetBuildingIds"
                  value={b.id}
                  checked={targetBuildingIds.includes(b.id)}
                  onChange={() => toggle(targetBuildingIds, setTargetBuildingIds, b.id)}
                  className={checkboxClasses}
                />
                {b.name}
              </label>
            ))}
          </div>
        ) : null}

        {audience === "UNITS" ? (
          <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-slate-200 p-3">
            {units.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="targetUnitIds"
                  value={u.id}
                  checked={targetUnitIds.includes(u.id)}
                  onChange={() => toggle(targetUnitIds, setTargetUnitIds, u.id)}
                  className={checkboxClasses}
                />
                {u.buildingName} / Unit {u.unitNumber}
              </label>
            ))}
          </div>
        ) : null}

        {audience === "FLOORS" ? (
          <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-slate-200 p-3">
            {floors.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="targetFloors"
                  value={f.key}
                  checked={targetFloors.includes(f.key)}
                  onChange={() => toggle(targetFloors, setTargetFloors, f.key)}
                  className={checkboxClasses}
                />
                {f.label}
              </label>
            ))}
          </div>
        ) : null}

        {audience === "INDIVIDUALS" ? (
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-xs text-slate-500">Pick the residents who should receive this announcement.</p>
            <div className="mt-1 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-slate-200 p-3">
              {residents.map((r) => (
                <label key={r.userId} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="includeUserIds"
                    value={r.userId}
                    checked={includeUserIds.includes(r.userId)}
                    onChange={() => toggle(includeUserIds, setIncludeUserIds, r.userId)}
                    className={checkboxClasses}
                  />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </fieldset>

      <p className="text-sm text-slate-600">
        This will notify <strong>{recipientCount}</strong> resident{recipientCount === 1 ? "" : "s"}.
      </p>

      <label className={labelClasses}>
        Attachments (optional)
        <input type="file" name="attachments" multiple className={inputClasses} />
      </label>

      <label className={labelClasses}>
        Expires on (optional)
        <input
          type="date"
          name="expiresAt"
          defaultValue={defaultValues?.expiresAt ? defaultValues.expiresAt.toISOString().slice(0, 10) : ""}
          className={inputClasses}
        />
      </label>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="allowReplies" defaultChecked={defaultValues?.allowReplies} className={checkboxClasses} />
          Allow tenant replies (routed to your inbox). Otherwise this is broadcast-only.
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="requireAcknowledgment"
            checked={requireAcknowledgment}
            onChange={(e) => setRequireAcknowledgment(e.target.checked)}
            className={checkboxClasses}
          />
          Require tenant acknowledgment
        </label>
        {requireAcknowledgment ? (
          <label className={`${labelClasses} ml-6`}>
            Send a reminder after this many days if not acknowledged
            <input
              type="number"
              name="acknowledgmentReminderDays"
              min={1}
              max={60}
              defaultValue={defaultValues?.acknowledgmentReminderDays ?? 3}
              className={`${inputClasses} max-w-[8rem]`}
            />
          </label>
        ) : null}
      </div>

      <fieldset className="rounded-md border border-slate-200 p-3">
        <legend className={labelClasses}>Send timing</legend>
        <div className="flex flex-col gap-2">
          {(["NOW", "SCHEDULE", "DRAFT"] as const).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="sendTiming"
                value={option}
                checked={sendTiming === option}
                onChange={() => setSendTiming(option)}
              />
              {option === "NOW" ? "Send now" : option === "SCHEDULE" ? "Schedule for later" : "Save as draft"}
            </label>
          ))}
        </div>

        {sendTiming === "SCHEDULE" ? (
          <div className="mt-3 flex flex-col gap-3">
            <label className={labelClasses}>
              Send at
              <input type="datetime-local" name="scheduledAt" className={inputClasses} />
            </label>
          </div>
        ) : null}

        {sendTiming !== "DRAFT" ? (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClasses}>
              Recurrence
              <select name="recurrence" value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className={inputClasses}>
                <option value="NONE">Does not repeat</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
            {recurrence !== "NONE" ? (
              <label className={labelClasses}>
                Stop repeating after (optional)
                <input type="date" name="recurrenceEndsAt" className={inputClasses} />
              </label>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setPreview((p) => !p)}>
          {preview ? "Hide preview" : "Preview email"}
        </Button>
        {preview ? (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="rich-text-content rounded-md bg-white p-4 shadow-sm" dangerouslySetInnerHTML={{ __html: body }} />
          </div>
        ) : null}
      </div>

      {recipientCount > 20 ? (
        <label className="flex items-center gap-2 text-sm text-amber-800">
          <input
            type="checkbox"
            checked={confirmedLargeSend}
            onChange={(e) => setConfirmedLargeSend(e.target.checked)}
            className={checkboxClasses}
          />
          I understand this will email {recipientCount} residents.
        </label>
      ) : null}

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending || requiresConfirmation} className="self-start">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
