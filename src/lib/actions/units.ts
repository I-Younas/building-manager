"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { unitSchema } from "@/lib/validation/buildings";

export type FormActionState = { error: string } | undefined;

export async function createUnit(
  buildingId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const building = await prisma.building.findFirst({
    where: { id: buildingId, organizationId },
  });
  if (!building) {
    return { error: "Building not found." };
  }

  const parsed = unitSchema.safeParse({
    unitNumber: formData.get("unitNumber"),
    floor: formData.get("floor"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existing = await prisma.unit.findUnique({
    where: { buildingId_unitNumber: { buildingId, unitNumber: parsed.data.unitNumber } },
  });
  if (existing) {
    return { error: "A unit with this number already exists in this building." };
  }

  await prisma.unit.create({
    data: {
      organizationId,
      buildingId,
      unitNumber: parsed.data.unitNumber,
      floor: parsed.data.floor || null,
    },
  });

  revalidatePath("/dashboard/buildings");
  revalidatePath(`/dashboard/buildings/${buildingId}`);
}

export async function createUnitFromForm(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const buildingId = formData.get("buildingId");
  if (!buildingId || typeof buildingId !== "string") {
    return { error: "Please select a building." };
  }
  const result = await createUnit(buildingId, _prevState, formData);
  if (result?.error) return result;
  redirect("/dashboard/buildings");
}

export async function removeUnitResident(unitResidentId: string) {
  const { organizationId } = await requireAdminOrStaff();

  const link = await prisma.unitResident.findFirst({
    where: { id: unitResidentId, unit: { organizationId } },
    select: { unitId: true },
  });
  if (!link) {
    throw new Error("Resident link not found.");
  }

  await prisma.unitResident.delete({ where: { id: unitResidentId } });
  revalidatePath(`/dashboard/units/${link.unitId}`);
}
