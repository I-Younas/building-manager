import "server-only";
import { prisma } from "@/lib/db";

export type Recipient = { userId: string; email: string; name: string };

type AnnouncementForRecipients = {
  id: string;
  organizationId: string;
  audience: "ALL_ORG" | "BUILDINGS" | "UNITS" | "INDIVIDUALS";
  targetBuildingIds: string[];
  targetUnitIds: string[];
};

export async function resolveRecipients(announcement: AnnouncementForRecipients): Promise<Recipient[]> {
  const { organizationId, audience, targetBuildingIds, targetUnitIds } = announcement;

  let baseUserIds: string[] = [];

  if (audience === "ALL_ORG") {
    const links = await prisma.unitResident.findMany({
      where: { unit: { organizationId } },
      select: { userId: true },
    });
    baseUserIds = links.map((l) => l.userId);
  } else if (audience === "BUILDINGS") {
    const links = await prisma.unitResident.findMany({
      where: { unit: { organizationId, buildingId: { in: targetBuildingIds } } },
      select: { userId: true },
    });
    baseUserIds = links.map((l) => l.userId);
  } else if (audience === "UNITS") {
    const links = await prisma.unitResident.findMany({
      where: { unit: { organizationId }, unitId: { in: targetUnitIds } },
      select: { userId: true },
    });
    baseUserIds = links.map((l) => l.userId);
  }

  const overrides = await prisma.announcementRecipientOverride.findMany({
    where: { announcementId: announcement.id },
    include: { user: true },
  });
  const includeOverrides = overrides.filter((o) => o.mode === "INCLUDE");
  const excludeUserIds = new Set(overrides.filter((o) => o.mode === "EXCLUDE").map((o) => o.userId));

  const userIdSet = new Set(baseUserIds);
  for (const override of includeOverrides) {
    userIdSet.add(override.userId);
  }
  for (const userId of excludeUserIds) {
    userIdSet.delete(userId);
  }

  if (userIdSet.size === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: [...userIdSet] }, isActive: true },
    select: { id: true, email: true, name: true },
  });

  return users.map((u) => ({ userId: u.id, email: u.email, name: u.name }));
}
