"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { requireAdminOrStaff, requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { announcementSchema } from "@/lib/validation/announcements";
import { sendAnnouncementNow } from "@/lib/announcements/send";

export type FormActionState = { error: string } | undefined;

const CATEGORY_DEFAULT_PRIORITY: Record<string, string> = {
  EMERGENCY: "URGENT",
  MAINTENANCE: "IMPORTANT",
  POLICY: "IMPORTANT",
};

type ParsedAnnouncement = {
  title: string;
  body: string;
  category: "GENERAL" | "MAINTENANCE" | "EMERGENCY" | "POLICY" | "EVENT" | "BILLING" | "AMENITY";
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  audience: "ALL_ORG" | "BUILDINGS" | "UNITS" | "INDIVIDUALS";
  targetBuildingIds: string[];
  targetUnitIds: string[];
  includeUserIds: string[];
  excludeUserIds: string[];
  expiresAt: Date | null;
  allowReplies: boolean;
  requireAcknowledgment: boolean;
  acknowledgmentReminderDays: number | null;
  status: "DRAFT" | "SCHEDULED" | "SENT";
  scheduledAt: Date | null;
  recurrence: "NONE" | "WEEKLY" | "MONTHLY";
  recurrenceEndsAt: Date | null;
  nextRunAt: Date | null;
  isTemplate: boolean;
};

type ParseResult = { error: string } | { data: ParsedAnnouncement };

function advanceRecurrence(date: Date, recurrence: "WEEKLY" | "MONTHLY") {
  const next = new Date(date);
  if (recurrence === "WEEKLY") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

async function parseAnnouncementForm(formData: FormData, organizationId: string): Promise<ParseResult> {
  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    audience: formData.get("audience"),
    targetBuildingIds: formData.getAll("targetBuildingIds"),
    targetUnitIds: formData.getAll("targetUnitIds"),
    includeUserIds: formData.getAll("includeUserIds"),
    excludeUserIds: formData.getAll("excludeUserIds"),
    expiresAt: formData.get("expiresAt") ?? undefined,
    allowReplies: formData.get("allowReplies") === "on",
    requireAcknowledgment: formData.get("requireAcknowledgment") === "on",
    acknowledgmentReminderDays: formData.get("acknowledgmentReminderDays") || undefined,
    sendTiming: formData.get("sendTiming"),
    scheduledAt: formData.get("scheduledAt") ?? undefined,
    recurrence: formData.get("recurrence") ?? "NONE",
    recurrenceEndsAt: formData.get("recurrenceEndsAt") ?? undefined,
    isTemplate: formData.get("isTemplate") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  if (data.audience === "BUILDINGS") {
    if (data.targetBuildingIds.length === 0) {
      return { error: "Select at least one building." };
    }
    const count = await prisma.building.count({
      where: { organizationId, id: { in: data.targetBuildingIds } },
    });
    if (count !== data.targetBuildingIds.length) {
      return { error: "One or more selected buildings were not found." };
    }
  }

  if (data.audience === "UNITS") {
    if (data.targetUnitIds.length === 0) {
      return { error: "Select at least one unit." };
    }
    const count = await prisma.unit.count({
      where: { organizationId, id: { in: data.targetUnitIds } },
    });
    if (count !== data.targetUnitIds.length) {
      return { error: "One or more selected units were not found." };
    }
  }

  if (data.audience === "INDIVIDUALS" && data.includeUserIds.length === 0) {
    return { error: "Select at least one resident." };
  }

  let expiresAt: Date | null = null;
  if (data.expiresAt) {
    expiresAt = new Date(data.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) return { error: "Enter a valid expiry date." };
  }

  let scheduledAt: Date | null = null;
  if (data.sendTiming === "SCHEDULE") {
    if (!data.scheduledAt) return { error: "Choose a date and time to schedule this announcement." };
    scheduledAt = new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      return { error: "Scheduled time must be in the future." };
    }
  }

  let recurrenceEndsAt: Date | null = null;
  if (data.recurrence !== "NONE" && data.recurrenceEndsAt) {
    recurrenceEndsAt = new Date(data.recurrenceEndsAt);
    if (Number.isNaN(recurrenceEndsAt.getTime())) return { error: "Enter a valid recurrence end date." };
  }

  if (data.requireAcknowledgment && !data.acknowledgmentReminderDays) {
    return { error: "Set how many days to wait before sending an acknowledgment reminder." };
  }

  const status: ParsedAnnouncement["status"] =
    data.sendTiming === "DRAFT" ? "DRAFT" : data.sendTiming === "SCHEDULE" ? "SCHEDULED" : "SENT";

  let nextRunAt: Date | null = null;
  if (data.recurrence !== "NONE") {
    nextRunAt = data.sendTiming === "SCHEDULE" ? scheduledAt : advanceRecurrence(new Date(), data.recurrence);
  }

  return {
    data: {
      title: data.title,
      body: data.body,
      category: data.category,
      priority: data.priority,
      audience: data.audience,
      targetBuildingIds: data.audience === "BUILDINGS" ? data.targetBuildingIds : [],
      targetUnitIds: data.audience === "UNITS" ? data.targetUnitIds : [],
      includeUserIds: data.includeUserIds,
      excludeUserIds: data.excludeUserIds,
      expiresAt,
      allowReplies: data.allowReplies,
      requireAcknowledgment: data.requireAcknowledgment,
      acknowledgmentReminderDays: data.requireAcknowledgment ? data.acknowledgmentReminderDays ?? null : null,
      status,
      scheduledAt,
      recurrence: data.recurrence,
      recurrenceEndsAt,
      nextRunAt,
      isTemplate: data.isTemplate,
    },
  };
}

async function saveRecipientOverrides(announcementId: string, includeUserIds: string[], excludeUserIds: string[]) {
  await prisma.announcementRecipientOverride.deleteMany({ where: { announcementId } });
  const rows = [
    ...includeUserIds.map((userId) => ({ announcementId, userId, mode: "INCLUDE" as const })),
    ...excludeUserIds.map((userId) => ({ announcementId, userId, mode: "EXCLUDE" as const })),
  ];
  if (rows.length > 0) {
    await prisma.announcementRecipientOverride.createMany({ data: rows, skipDuplicates: true });
  }
}

async function saveAttachments(announcementId: string, formData: FormData) {
  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    const blob = await put(`announcements/${announcementId}/${file.name}`, file, { access: "public" });
    await prisma.announcementAttachment.create({
      data: {
        announcementId,
        fileName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        contentType: file.type || "application/octet-stream",
      },
    });
  }
}

export async function createAnnouncement(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId } = await requireAdminOrStaff();

  const result = await parseAnnouncementForm(formData, organizationId);
  if ("error" in result) return { error: result.error };

  const correctsAnnouncementId = (formData.get("correctsAnnouncementId") as string | null) || null;
  const { includeUserIds, excludeUserIds, ...announcementData } = result.data;

  const announcement = await prisma.announcement.create({
    data: {
      organizationId,
      postedById: user.id,
      correctsAnnouncementId,
      ...announcementData,
    },
  });

  await saveRecipientOverrides(announcement.id, includeUserIds, excludeUserIds);
  await saveAttachments(announcement.id, formData);

  if (announcementData.status === "SENT" && !announcementData.isTemplate) {
    await sendAnnouncementNow(announcement.id);
  }

  redirect("/dashboard/announcements");
}

export async function updateAnnouncement(
  announcementId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const existing = await prisma.announcement.findFirst({ where: { id: announcementId, organizationId } });
  if (!existing) return { error: "Announcement not found." };
  if (existing.status === "SENT") {
    return { error: "Sent announcements can't be edited. Use \"Send correction\" instead." };
  }

  const result = await parseAnnouncementForm(formData, organizationId);
  if ("error" in result) return { error: result.error };

  const { includeUserIds, excludeUserIds, ...announcementData } = result.data;

  await prisma.announcement.update({ where: { id: announcementId }, data: announcementData });
  await saveRecipientOverrides(announcementId, includeUserIds, excludeUserIds);
  await saveAttachments(announcementId, formData);

  if (announcementData.status === "SENT" && !announcementData.isTemplate) {
    await sendAnnouncementNow(announcementId);
  }

  redirect("/dashboard/announcements");
}

export async function deleteAnnouncement(announcementId: string) {
  const { organizationId } = await requireAdminOrStaff();

  await prisma.announcement.deleteMany({ where: { id: announcementId, organizationId } });

  revalidatePath("/dashboard/announcements");
}

export async function acknowledgeAnnouncement(announcementId: string) {
  const { user, organizationId } = await requireOrgScope();

  const announcement = await prisma.announcement.findFirst({ where: { id: announcementId, organizationId } });
  if (!announcement) return;

  await prisma.announcementAcknowledgment.upsert({
    where: { announcementId_userId: { announcementId, userId: user.id } },
    create: { announcementId, userId: user.id },
    update: {},
  });

  revalidatePath("/dashboard/announcements");
}
