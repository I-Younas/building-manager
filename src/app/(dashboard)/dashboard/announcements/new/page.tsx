import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { createAnnouncement } from "@/lib/actions/announcements";
import { AnnouncementForm, type AnnouncementDefaultValues } from "../announcement-form";
import { PageHeader } from "@/components/ui";

export default async function NewAnnouncementPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicateFrom?: string; correctsFrom?: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { duplicateFrom, correctsFrom } = await searchParams;

  const buildings = await prisma.building.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
  const unitRows = await prisma.unit.findMany({
    where: { organizationId },
    include: { building: true },
    orderBy: [{ building: { name: "asc" } }, { unitNumber: "asc" }],
  });
  const units = unitRows.map((u) => ({ id: u.id, unitNumber: u.unitNumber, buildingId: u.buildingId, buildingName: u.building.name }));

  const floorsSeen = new Set<string>();
  const floors = unitRows
    .filter((u) => u.floor !== null && (floorsSeen.has(`${u.buildingId}::${u.floor}`) ? false : (floorsSeen.add(`${u.buildingId}::${u.floor}`), true)))
    .map((u) => ({ key: `${u.buildingId}::${u.floor}`, label: `${u.building.name} — Floor ${u.floor}` }));

  const unitLinks = await prisma.unitResident.findMany({
    where: { unit: { organizationId } },
    include: { user: true, unit: true },
  });
  const seen = new Set<string>();
  const residents = unitLinks
    .filter((l) => (seen.has(l.userId) ? false : (seen.add(l.userId), true)))
    .map((l) => ({
      userId: l.userId,
      name: l.user.name,
      email: l.user.email,
      buildingId: l.unit.buildingId,
      unitId: l.unitId,
      floor: l.unit.floor,
    }));

  const sourceId = duplicateFrom || correctsFrom;
  let defaultValues: AnnouncementDefaultValues | undefined;
  let title = "Create announcement";

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
        targetFloors: source.targetFloors,
        includeUserIds: source.recipientOverrides.filter((o) => o.mode === "INCLUDE").map((o) => o.userId),
        expiresAt: source.expiresAt,
        allowReplies: source.allowReplies,
        requireAcknowledgment: source.requireAcknowledgment,
        acknowledgmentReminderDays: source.acknowledgmentReminderDays,
        scheduledAt: null,
        recurrence: "NONE",
        recurrenceEndsAt: null,
        correctsAnnouncementId: correctsFrom || null,
      };
      title = correctsFrom ? "Send correction" : "Create announcement";
    }
  }

  return (
    <div>
      <PageHeader title={title} />
      <AnnouncementForm
        action={createAnnouncement}
        buildings={buildings}
        units={units}
        floors={floors}
        residents={residents}
        defaultValues={defaultValues}
        submitLabel="Create announcement"
      />
    </div>
  );
}
