import { notFound, redirect } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { updateAnnouncement } from "@/lib/actions/announcements";
import { AnnouncementForm, type AnnouncementDefaultValues } from "../../announcement-form";
import { PageHeader } from "@/components/ui";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { announcementId } = await params;

  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, organizationId },
    include: { recipientOverrides: true },
  });
  if (!announcement) notFound();

  if (announcement.status === "SENT") {
    redirect(`/dashboard/announcements/${announcementId}`);
  }

  const buildings = await prisma.building.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
  const unitRows = await prisma.unit.findMany({
    where: { organizationId },
    include: { building: true },
    orderBy: [{ building: { name: "asc" } }, { unitNumber: "asc" }],
  });
  const units = unitRows.map((u) => ({ id: u.id, unitNumber: u.unitNumber, buildingId: u.buildingId, buildingName: u.building.name }));

  const unitLinks = await prisma.unitResident.findMany({
    where: { unit: { organizationId } },
    include: { user: true, unit: true },
  });
  const seen = new Set<string>();
  const residents = unitLinks
    .filter((l) => (seen.has(l.userId) ? false : (seen.add(l.userId), true)))
    .map((l) => ({ userId: l.userId, name: l.user.name, email: l.user.email, buildingId: l.unit.buildingId, unitId: l.unitId }));

  const defaultValues: AnnouncementDefaultValues = {
    title: announcement.title,
    body: announcement.body,
    category: announcement.category,
    priority: announcement.priority,
    audience: announcement.audience,
    targetBuildingIds: announcement.targetBuildingIds,
    targetUnitIds: announcement.targetUnitIds,
    includeUserIds: announcement.recipientOverrides.filter((o) => o.mode === "INCLUDE").map((o) => o.userId),
    excludeUserIds: announcement.recipientOverrides.filter((o) => o.mode === "EXCLUDE").map((o) => o.userId),
    expiresAt: announcement.expiresAt,
    allowReplies: announcement.allowReplies,
    requireAcknowledgment: announcement.requireAcknowledgment,
    acknowledgmentReminderDays: announcement.acknowledgmentReminderDays,
    scheduledAt: announcement.scheduledAt,
    recurrence: announcement.recurrence,
    recurrenceEndsAt: announcement.recurrenceEndsAt,
    isTemplate: announcement.isTemplate,
    correctsAnnouncementId: announcement.correctsAnnouncementId,
  };

  return (
    <div>
      <PageHeader title={announcement.isTemplate ? "Edit template" : "Edit announcement"} />
      <AnnouncementForm
        action={updateAnnouncement.bind(null, announcementId)}
        buildings={buildings}
        units={units}
        residents={residents}
        defaultValues={defaultValues}
        submitLabel="Save changes"
      />
    </div>
  );
}
