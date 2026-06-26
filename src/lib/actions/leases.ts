"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { leaseDatesSchema } from "@/lib/validation/leases";

export type FormActionState = { error: string } | undefined;

type ParsedLeaseDates =
  | { ok: false; error: string }
  | { ok: true; leaseStartDate: Date; leaseEndDate: Date };

function parseLeaseDates(formData: FormData): ParsedLeaseDates {
  const parsed = leaseDatesSchema.safeParse({
    leaseStartDate: formData.get("leaseStartDate"),
    leaseEndDate: formData.get("leaseEndDate"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const leaseStartDate = new Date(parsed.data.leaseStartDate);
  const leaseEndDate = new Date(parsed.data.leaseEndDate);
  if (Number.isNaN(leaseStartDate.getTime()) || Number.isNaN(leaseEndDate.getTime())) {
    return { ok: false, error: "Enter valid lease dates." };
  }
  if (leaseEndDate <= leaseStartDate) {
    return { ok: false, error: "Lease end date must be after the start date." };
  }

  return { ok: true, leaseStartDate, leaseEndDate };
}

export async function createLease(
  unitResidentId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const link = await prisma.unitResident.findFirst({
    where: { id: unitResidentId, unit: { organizationId } },
  });
  if (!link) {
    return { error: "Resident link not found." };
  }

  const existingActive = await prisma.lease.findFirst({
    where: { unitId: link.unitId, status: "ACTIVE" },
  });
  if (existingActive) {
    return { error: "This unit already has an active lease." };
  }

  const dates = parseLeaseDates(formData);
  if (!dates.ok) return { error: dates.error };

  await prisma.lease.create({
    data: {
      unitId: link.unitId,
      primaryResidentId: link.userId,
      leaseStartDate: dates.leaseStartDate,
      leaseEndDate: dates.leaseEndDate,
    },
  });

  revalidatePath(`/dashboard/units/${link.unitId}`);
}

export async function startRenewal(leaseId: string) {
  const { organizationId } = await requireAdminOrStaff();

  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, unit: { organizationId } },
  });
  if (!lease || lease.renewalStatus !== "PENDING_DECISION") {
    throw new Error("This lease isn't ready to start a renewal.");
  }

  await prisma.lease.update({
    where: { id: leaseId },
    data: { renewalStatus: "RENEWAL_IN_PROGRESS" },
  });

  revalidatePath(`/dashboard/units/${lease.unitId}`);
}

export async function confirmRenewal(
  leaseId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, unit: { organizationId } },
  });
  if (!lease || lease.renewalStatus !== "RENEWAL_IN_PROGRESS") {
    return { error: "This lease isn't ready to confirm a renewal." };
  }

  const dates = parseLeaseDates(formData);
  if (!dates.ok) return { error: dates.error };

  await prisma.$transaction([
    prisma.lease.update({
      where: { id: leaseId },
      data: { status: "SUPERSEDED", renewalStatus: "RENEWED" },
    }),
    prisma.lease.create({
      data: {
        unitId: lease.unitId,
        primaryResidentId: lease.primaryResidentId,
        leaseStartDate: dates.leaseStartDate,
        leaseEndDate: dates.leaseEndDate,
        previousLeaseId: lease.id,
      },
    }),
  ]);

  revalidatePath(`/dashboard/units/${lease.unitId}`);
}

export async function markNotRenewing(leaseId: string) {
  const { organizationId } = await requireAdminOrStaff();

  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, unit: { organizationId } },
  });
  if (!lease || (lease.renewalStatus !== "PENDING_DECISION" && lease.renewalStatus !== "RENEWAL_IN_PROGRESS")) {
    throw new Error("This lease isn't in a renewal decision window.");
  }

  await prisma.lease.update({
    where: { id: leaseId },
    data: { renewalStatus: "NOT_RENEWING" },
  });

  revalidatePath(`/dashboard/units/${lease.unitId}`);
}
