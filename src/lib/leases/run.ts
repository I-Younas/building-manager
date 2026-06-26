import "server-only";
import { prisma } from "@/lib/db";
import { RENEWAL_WINDOW_DAYS } from "./status";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function flagLeasesEnteringRenewalWindow(now: Date) {
  const result = await prisma.lease.updateMany({
    where: {
      status: "ACTIVE",
      renewalStatus: null,
      leaseEndDate: { lte: addDays(now, RENEWAL_WINDOW_DAYS) },
    },
    data: { renewalStatus: "PENDING_DECISION" },
  });

  return { flagged: result.count };
}

export async function expireNotRenewingLeases(now: Date) {
  const dueLeases = await prisma.lease.findMany({
    where: { status: "ACTIVE", renewalStatus: "NOT_RENEWING", leaseEndDate: { lte: now } },
  });

  let expired = 0;
  let deactivatedResidents = 0;

  for (const lease of dueLeases) {
    await prisma.$transaction([
      prisma.lease.update({ where: { id: lease.id }, data: { status: "EXPIRED" } }),
      prisma.unitResident.deleteMany({ where: { unitId: lease.unitId, userId: lease.primaryResidentId } }),
    ]);
    expired += 1;

    const remainingLinks = await prisma.unitResident.count({ where: { userId: lease.primaryResidentId } });
    if (remainingLinks === 0) {
      await prisma.user.update({ where: { id: lease.primaryResidentId }, data: { isActive: false } });
      deactivatedResidents += 1;
    }
  }

  return { expired, deactivatedResidents };
}
