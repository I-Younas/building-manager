"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgScope, requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { registerVisitorSchema } from "@/lib/validation/visitors";

export type FormActionState = { error: string } | undefined;

export async function registerVisitor(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId } = await requireOrgScope();

  const parsed = registerVisitorSchema.safeParse({
    unitId: formData.get("unitId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    purpose: formData.get("purpose"),
    expectedAt: formData.get("expectedAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const unitLink = await prisma.unitResident.findUnique({
    where: { unitId_userId: { unitId: parsed.data.unitId, userId: user.id } },
  });
  if (!unitLink) {
    return { error: "You can only register visitors for your own unit." };
  }

  const expectedAt = new Date(parsed.data.expectedAt);
  if (Number.isNaN(expectedAt.getTime())) {
    return { error: "Enter a valid expected date/time." };
  }

  await prisma.visitor.create({
    data: {
      organizationId,
      unitId: parsed.data.unitId,
      registeredById: user.id,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      purpose: parsed.data.purpose || null,
      expectedAt,
    },
  });

  redirect("/dashboard/visitors");
}

export async function checkInVisitor(visitorId: string) {
  const { organizationId } = await requireAdminOrStaff();

  const visitor = await prisma.visitor.findFirst({ where: { id: visitorId, organizationId } });
  if (!visitor) throw new Error("Visitor not found.");
  if (visitor.status !== "EXPECTED") throw new Error("Only expected visitors can be checked in.");

  await prisma.visitor.update({
    where: { id: visitorId },
    data: { status: "CHECKED_IN", checkedInAt: new Date() },
  });

  revalidatePath("/dashboard/visitors");
}

export async function checkOutVisitor(visitorId: string) {
  const { organizationId } = await requireAdminOrStaff();

  const visitor = await prisma.visitor.findFirst({ where: { id: visitorId, organizationId } });
  if (!visitor) throw new Error("Visitor not found.");
  if (visitor.status !== "CHECKED_IN") throw new Error("Only checked-in visitors can be checked out.");

  await prisma.visitor.update({
    where: { id: visitorId },
    data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
  });

  revalidatePath("/dashboard/visitors");
}

export async function cancelVisitorRegistration(visitorId: string) {
  const { user, organizationId, role } = await requireOrgScope();

  const visitor = await prisma.visitor.findFirst({ where: { id: visitorId, organizationId } });
  if (!visitor) throw new Error("Visitor not found.");

  if (role === "RESIDENT") {
    const isUnitMember = await prisma.unitResident.findUnique({
      where: { unitId_userId: { unitId: visitor.unitId, userId: user.id } },
    });
    if (!isUnitMember) {
      throw new Error("You can only cancel visitors for your own unit.");
    }
  }
  if (visitor.status !== "EXPECTED") {
    throw new Error("Only expected visitors can be cancelled.");
  }

  await prisma.visitor.update({ where: { id: visitorId }, data: { status: "CANCELLED" } });

  revalidatePath("/dashboard/visitors");
}
