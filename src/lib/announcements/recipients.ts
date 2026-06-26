import "server-only";
import { prisma } from "@/lib/db";

export type Recipient = { userId: string; email: string; name: string };

type AnnouncementForRecipients = {
  id: string;
  organizationId: string;
  audience: "ALL_ORG" | "BUILDINGS" | "UNITS" | "FLOORS" | "INDIVIDUALS";
  targetBuildingIds: string[];
  targetUnitIds: string[];
  targetFloors: string[];
};

export async function resolveRecipients(announcement: AnnouncementForRecipients): Promise<Recipient[]> {
  const { organizationId, audience, targetBuildingIds, targetUnitIds, targetFloors } = announcement;

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
  } else if (audience === "FLOORS") {
    const pairs = targetFloors.map((f) => {
      const [buildingId, floor] = f.split("::");
      return { buildingId, floor };
    });
    const links = await prisma.unitResident.findMany({
      where: { unit: { organizationId, OR: pairs.map((p) => ({ buildingId: p.buildingId, floor: p.floor })) } },
      select: { userId: true },
    });
    baseUserIds = links.map((l) => l.userId);
  }

  const includeOverrides = await prisma.announcementRecipientOverride.findMany({
    where: { announcementId: announcement.id, mode: "INCLUDE" },
  });

  const userIdSet = new Set(baseUserIds);
  for (const override of includeOverrides) {
    userIdSet.add(override.userId);
  }

  if (userIdSet.size === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: [...userIdSet] }, isActive: true },
    select: { id: true, email: true, name: true },
  });

  return users.map((u) => ({ userId: u.id, email: u.email, name: u.name }));
}
