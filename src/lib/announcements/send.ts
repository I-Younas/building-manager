import "server-only";
import { prisma } from "@/lib/db";
import { sendAnnouncementEmail } from "@/lib/email";
import { resolveRecipients } from "./recipients";

const PRIORITY_PREFIX: Record<string, string> = {
  URGENT: "[URGENT] ",
  IMPORTANT: "[Important] ",
  NORMAL: "",
};

const CATEGORY_LABEL: Record<string, string> = {
  GENERAL: "General notice",
  MAINTENANCE: "Maintenance / utility interruption",
  EMERGENCY: "Emergency / safety alert",
  POLICY: "Policy / rule change",
  EVENT: "Event / community update",
  BILLING: "Billing / payment reminder",
  AMENITY: "Amenity closure",
};

export function buildAnnouncementSubject(announcement: { title: string; priority: string }) {
  return `${PRIORITY_PREFIX[announcement.priority] ?? ""}${announcement.title}`;
}

export function buildAnnouncementHtml(announcement: {
  body: string;
  category: string;
  allowReplies: boolean;
}) {
  const replyNote = announcement.allowReplies
    ? "<p style=\"color:#64748b;font-size:12px\">You can reply directly to this email.</p>"
    : "<p style=\"color:#64748b;font-size:12px\">This is a broadcast-only message; replies are not monitored.</p>";

  const style = `
    <style>
      ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
      ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
      li { margin-bottom: 0.25em; }
      p { margin-bottom: 0.75em; }
    </style>
  `;

  return `${style}<p style="color:#64748b;font-size:12px;text-transform:uppercase">${CATEGORY_LABEL[announcement.category] ?? "General notice"}</p>${announcement.body}${replyNote}`;
}

export async function sendAnnouncementNow(announcementId: string) {
  const announcement = await prisma.announcement.findUniqueOrThrow({
    where: { id: announcementId },
    include: { postedBy: true, attachments: true },
  });

  const recipients = await resolveRecipients(announcement);
  const subject = buildAnnouncementSubject(announcement);
  const bodyHtml = buildAnnouncementHtml(announcement);
  const replyTo = announcement.allowReplies ? announcement.postedBy.email : undefined;
  const attachments = announcement.attachments.map((a) => ({ filename: a.fileName, url: a.fileUrl }));

  for (const recipient of recipients) {
    const delivery = await prisma.announcementDelivery.upsert({
      where: { announcementId_userId: { announcementId, userId: recipient.userId } },
      create: { announcementId, userId: recipient.userId, email: recipient.email, status: "QUEUED" },
      update: { status: "QUEUED" },
    });

    try {
      const { messageId } = await sendAnnouncementEmail({
        to: recipient.email,
        subject,
        bodyHtml,
        attachments,
        replyTo,
      });
      await prisma.announcementDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT", sentAt: new Date(), resendMessageId: messageId },
      });
    } catch {
      await prisma.announcementDelivery.update({
        where: { id: delivery.id },
        data: { status: "FAILED" },
      });
    }
  }

  return { recipientCount: recipients.length };
}

function advanceRecurrence(date: Date, recurrence: "WEEKLY" | "MONTHLY") {
  const next = new Date(date);
  if (recurrence === "WEEKLY") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function runDueAnnouncements(now: Date) {
  const dueScheduled = await prisma.announcement.findMany({
    where: { status: "SCHEDULED", recurrence: "NONE", scheduledAt: { lte: now } },
  });
  for (const announcement of dueScheduled) {
    await sendAnnouncementNow(announcement.id);
    await prisma.announcement.update({
      where: { id: announcement.id },
      data: { status: "SENT", publishedAt: now },
    });
  }

  const dueRecurring = await prisma.announcement.findMany({
    where: { recurrence: { in: ["WEEKLY", "MONTHLY"] }, nextRunAt: { lte: now } },
  });
  for (const announcement of dueRecurring) {
    if (announcement.recurrenceEndsAt && announcement.recurrenceEndsAt < now) {
      await prisma.announcement.update({ where: { id: announcement.id }, data: { nextRunAt: null } });
      continue;
    }
    await sendAnnouncementNow(announcement.id);
    const nextRunAt = advanceRecurrence(announcement.nextRunAt ?? now, announcement.recurrence as "WEEKLY" | "MONTHLY");
    await prisma.announcement.update({
      where: { id: announcement.id },
      data: { status: "SENT", publishedAt: now, nextRunAt },
    });
  }

  return { sentScheduled: dueScheduled.length, sentRecurring: dueRecurring.length };
}

export async function sendAcknowledgmentReminders(now: Date) {
  const candidates = await prisma.announcement.findMany({
    where: { requireAcknowledgment: true, status: "SENT", acknowledgmentReminderDays: { not: null } },
  });

  let remindersSent = 0;
  for (const announcement of candidates) {
    const dueAt = new Date(announcement.publishedAt);
    dueAt.setDate(dueAt.getDate() + (announcement.acknowledgmentReminderDays ?? 0));
    if (dueAt > now) continue;

    const recipients = await resolveRecipients(announcement);
    const acknowledged = await prisma.announcementAcknowledgment.findMany({
      where: { announcementId: announcement.id },
      select: { userId: true },
    });
    const acknowledgedIds = new Set(acknowledged.map((a) => a.userId));

    const deliveries = await prisma.announcementDelivery.findMany({
      where: { announcementId: announcement.id },
    });
    const reminderSentIds = new Set(deliveries.filter((d) => d.reminderSentAt).map((d) => d.userId));

    const subject = `Reminder: please acknowledge "${announcement.title}"`;
    const bodyHtml = `<p>This is a reminder that you haven't yet acknowledged the announcement "${announcement.title}". Please log in and mark it as read.</p>`;

    for (const recipient of recipients) {
      if (acknowledgedIds.has(recipient.userId) || reminderSentIds.has(recipient.userId)) continue;
      try {
        await sendAnnouncementEmail({ to: recipient.email, subject, bodyHtml });
        remindersSent += 1;
      } catch {
        continue;
      }
      await prisma.announcementDelivery.updateMany({
        where: { announcementId: announcement.id, userId: recipient.userId },
        data: { reminderSentAt: now },
      });
    }
  }

  return { remindersSent };
}
