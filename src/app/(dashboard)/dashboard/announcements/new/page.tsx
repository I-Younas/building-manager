import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { createAnnouncement } from "@/lib/actions/announcements";
import { AnnouncementForm, type AnnouncementDefaultValues } from "../announcement-form";
import { PageHeader } from "@/components/ui";

export default async function NewAnnouncementPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicateFrom?: string; correctsFrom?: string; fromTemplate?: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { duplicateFrom, correctsFrom, fromTemplate } = await searchParams;

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

  const sourceId = duplicateFrom || correctsFrom || fromTemplate;
  let defaultValues: AnnouncementDefaultValues | undefined;
  let title = "Post announcement";

  if (sourceId) {
    const source = await prisma.announcement.findFirst({
      where: { id: sourceId, organizationId },
      include: { recipientOverrides: true },
    });
    if (source) {
      defaultValues = {
        title: correctsFrom ? `Correction: ${source.title}` : source.title,
        body: source.body,
        category: source.category,
        priority: source.priority,
        audience: source.audience,
        targetBuildingIds: source.targetBuildingIds,
        targetUnitIds: source.targetUnitIds,
        includeUserIds: source.recipientOverrides.filter((o) => o.mode === "INCLUDE").map((o) => o.userId),
        excludeUserIds: source.recipientOverrides.filter((o) => o.mode === "EXCLUDE").map((o) => o.userId),
        expiresAt: source.expiresAt,
        allowReplies: source.allowReplies,
        requireAcknowledgment: source.requireAcknowledgment,
        acknowledgmentReminderDays: source.acknowledgmentReminderDays,
        scheduledAt: null,
        recurrence: "NONE",
        recurrenceEndsAt: null,
        isTemplate: fromTemplate ? false : source.isTemplate,
        correctsAnnouncementId: correctsFrom || null,
      };
      title = correctsFrom ? "Send correction" : "Post announcement";
    }
  }

  return (
    <div>
      <PageHeader title={title} />
      <AnnouncementForm
        action={createAnnouncement}
        buildings={buildings}
        units={units}
        residents={residents}
        defaultValues={defaultValues}
        submitLabel="Post announcement"
      />
    </div>
  );
}
