import { prisma } from "@/lib/db";

export const RENEWAL_WINDOW_DAYS = 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type UnitStatus = "VACANT" | "PENDING" | "RENTED";
export type LeaseDisplayStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";

export function getUnitStatus(unit: {
  residentLinks: { id: string }[];
  leases: { status: string }[];
}): UnitStatus {
  if (unit.leases.some((lease) => lease.status === "ACTIVE")) return "RENTED";
  if (unit.residentLinks.length > 0) return "PENDING";
  return "VACANT";
}

// dueDate-style fields come from date-only <input>s, which parse as UTC midnight.
// Compare against UTC midnight of "today" so a lease ending today doesn't read
// as expired before the day is even over — mirrors src/lib/invoice-status.ts.
export function getLeaseDisplayStatus(lease: { leaseEndDate: Date }, now = new Date()): LeaseDisplayStatus {
  const todayUtcMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  if (lease.leaseEndDate.getTime() < todayUtcMidnight) return "EXPIRED";

  const daysToEnd = Math.floor((lease.leaseEndDate.getTime() - todayUtcMidnight) / MS_PER_DAY);
  return daysToEnd <= RENEWAL_WINDOW_DAYS ? "EXPIRING_SOON" : "ACTIVE";
}

async function getPreviousLeaseId(leaseId: string): Promise<string | null> {
  const current = await prisma.lease.findUnique({
    where: { id: leaseId },
    select: { previousLeaseId: true },
  });
  return current?.previousLeaseId ?? null;
}

export async function getRenewalChain(leaseId: string): Promise<{ renewed: boolean; renewalCount: number }> {
  let renewalCount = 0;
  let currentId: string | null = leaseId;

  while (currentId) {
    const previousLeaseId: string | null = await getPreviousLeaseId(currentId);
    if (!previousLeaseId) break;
    renewalCount += 1;
    currentId = previousLeaseId;
  }

  return { renewed: renewalCount > 0, renewalCount };
}

export function getDaysVacant(unit: { createdAt: Date }, mostRecentLease: { leaseEndDate: Date } | null, now = new Date()): number {
  const since = mostRecentLease?.leaseEndDate ?? unit.createdAt;
  return Math.max(0, Math.floor((now.getTime() - since.getTime()) / MS_PER_DAY));
}
