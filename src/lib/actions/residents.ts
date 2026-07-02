"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

export async function deleteResident(membershipId: string) {
  const { organizationId } = await requireAdminOrStaff();

  const membership = await prisma.orgMembership.findFirst({
    where: { id: membershipId, organizationId, role: "RESIDENT" },
  });
  if (!membership) throw new Error("Resident not found.");

  await prisma.$transaction([
    prisma.unitResident.deleteMany({
      where: { userId: membership.userId, unit: { organizationId } },
    }),
    prisma.orgMembership.delete({ where: { id: membershipId } }),
  ]);

  revalidatePath("/dashboard/residents");
}
