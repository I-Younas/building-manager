"use client";

import { useActionState, useMemo, useState } from "react";
import { DatePicker } from "@/components/date-picker";
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
type StaffMember = { userId: string; name: string };

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
  allowReplies: boolean;
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
  staffMembers = [],
  defaultValues,
  submitLabel,
}: {
  action: Action;
  buildings: Building[];
  units: Unit[];
  floors: Floor[];
  residents: Resident[];
  staffMembers?: StaffMember[];
  defaultValues?: AnnouncementDefaultValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [category, setCategory] = useState(defaultValues?.category ?? "GENERAL");
  const [priority, setPriority] = useState(defaultValues?.priority ?? "NORMAL");
  const [audience, setAudience] = useState(defaultValues?.audience ?? "BUILDINGS");
  const [targetBuildingIds, setTargetBuildingIds] = useState<string[]>(defaultValues?.targetBuildingIds ?? []);
  const [targetUnitIds, setTargetUnitIds] = useState<string[]>(defaultValues?.targetUnitIds ?? []);
  const [targetFloors, setTargetFloors] = useState<string[]>(defaultValues?.targetFloors ?? []);
  const [includeUserIds, setIncludeUserIds] = useState<string[]>(defaultValues?.includeUserIds ?? []);
  const [allowReplies, setAllowReplies] = useState<"yes" | "no">(defaultValues?.allowReplies ? "yes" : "no");
  const [sendTiming, setSendTiming] = useState<"NOW" | "SCHEDULE" | "DRAFT">("NOW");
  const [recurrence, setRecurrence] = useState(defaultValues?.recurrence ?? "NONE");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [recurrenceStartAt, setRecurrenceStartAt] = useState("");
  const [recurrenceEndsAt, setRecurrenceEndsAt] = useState("");
  const [confirmedLargeSend, setConfirmedLargeSend] = useState(false);
  const [preview, setPreview] = useState(false);
  const [body, setBody] = useState(defaultValues?.body ?? "");

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const recipientCount = useMemo(() => {
    if (audience === "ALL_STAFF") return staffMembers.length;
    if (audience === "INDIVIDUAL_STAFF") return includeUserIds.filter((id) => staffMembers.some((s) => s.userId === id)).length;
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
  }, [residents, staffMembers, audience, targetBuildingIds, targetUnitIds, targetFloors, includeUserIds]);

  const isStaffAudience = audience === "ALL_STAFF" || audience === "INDIVIDUAL_STAFF";

  const requiresConfirmation = recipientCount > 20 && !confirmedLargeSend;

  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth();

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
        <select
          name="audience"
          value={audience}
          onChange={(e) => {
            setAudience(e.target.value);
            setIncludeUserIds([]);
          }}
          className={inputClasses}
        >
          <option value="BUILDINGS">Specific buildings</option>
          <option value="UNITS">Specific units</option>
          <option value="FLOORS">Specific floors</option>
          <option value="INDIVIDUALS">Individual residents only</option>
          <option value="ALL_STAFF">All staff</option>
          <option value="INDIVIDUAL_STAFF">Individual staff members</option>
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

        {audience === "INDIVIDUAL_STAFF" ? (
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-xs text-slate-500">Pick the staff members who should receive this announcement.</p>
            <div className="mt-1 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-slate-200 p-3">
              {staffMembers.map((s) => (
                <label key={s.userId} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="includeUserIds"
                    value={s.userId}
                    checked={includeUserIds.includes(s.userId)}
                    onChange={() => toggle(includeUserIds, setIncludeUserIds, s.userId)}
                    className={checkboxClasses}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </fieldset>

      <p className="text-sm text-slate-600">
        This will notify <strong>{recipientCount}</strong> {isStaffAudience ? "staff member" : "resident"}{recipientCount === 1 ? "" : "s"}.
      </p>

      <label className={labelClasses}>
        Attachments (optional)
        <input type="file" name="attachments" multiple className={inputClasses} />
      </label>

      <fieldset className="rounded-md border border-slate-200 p-3">
        <legend className={labelClasses}>Allow recipients to reply</legend>
        <div className="flex gap-6">
          {(["yes", "no"] as const).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="allowReplies"
                value={option}
                checked={allowReplies === option}
                onChange={() => setAllowReplies(option)}
              />
              {option === "yes" ? "Yes" : "No"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-3">
        <legend className={labelClasses}>Scheduling</legend>
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
            <input
              type="hidden"
              name="scheduledAt"
              value={scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : ""}
            />
            <div className="flex gap-3">
              <label className={`${labelClasses} flex-1`}>
                Date
                <DatePicker
                  name="_scheduleDate"
                  startYear={thisYear}
                  startMonth={thisMonth}
                  maxYear={thisYear + 2}
                  upward
                  onChange={setScheduleDate}
                />
              </label>
              <label className={`${labelClasses} w-32`}>
                Time
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className={inputClasses}
                />
              </label>
            </div>
          </div>
        ) : null}

        {sendTiming !== "DRAFT" ? (
          <div className="mt-3 flex flex-col gap-3">
            <label className={labelClasses}>
              Recurrence
              <select name="recurrence" value={recurrence} onChange={(e) => { setRecurrence(e.target.value); setRecurrenceStartAt(""); setRecurrenceEndsAt(""); }} className={inputClasses}>
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
              <input type="hidden" name="recurrenceStartAt" value={recurrenceStartAt} />
            ) : null}
            {recurrence !== "NONE" ? (
              <input type="hidden" name="recurrenceEndsAt" value={recurrenceEndsAt} />
            ) : null}

            {recurrence !== "NONE" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClasses}>
                  {recurrence === "CUSTOM" ? "Occurrence date" : "Starting from"}
                  <DatePicker
                    name="_recurrenceStartAt"
                    startYear={thisYear}
                    startMonth={thisMonth}
                    maxYear={thisYear + 5}
                    upward
                    onChange={setRecurrenceStartAt}
                  />
                </label>
                {recurrence !== "CUSTOM" ? (
                  <label className={labelClasses}>
                    Stop repeating after (optional)
                    <DatePicker
                      name="_recurrenceEndsAt"
                      startYear={thisYear}
                      startMonth={thisMonth}
                      maxYear={thisYear + 5}
                      upward
                      onChange={setRecurrenceEndsAt}
                    />
                  </label>
                ) : null}
              </div>
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
          I understand this will email {recipientCount} {isStaffAudience ? "staff members" : "residents"}.
        </label>
      ) : null}

      {state?.error ? <ErrorText>{state.error}</ErrorText> : null}

      <Button type="submit" disabled={pending || requiresConfirmation} className="self-start">
        {pending ? "Sending..." : submitLabel}
      </Button>
    </form>
  );
}
