"use server";

import { revalidatePath } from "next/cache";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

export async function removeStaff(staffUserId: string) {
  const { organizationId, role } = await requireOrgScope();
  if (role !== "ORG_ADMIN") throw new Error("Only org admins can remove staff.");

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: staffUserId, organizationId } },
  });
  if (!membership || membership.role !== "STAFF") throw new Error("Staff member not found.");

  await prisma.$transaction([
    prisma.orgMembership.delete({
      where: { userId_organizationId: { userId: staffUserId, organizationId } },
    }),
    prisma.session.deleteMany({
      where: { userId: staffUserId, activeOrganizationId: organizationId },
    }),
  ]);

  revalidatePath("/dashboard/staff");
}
