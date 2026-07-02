"use server";

import { redirect } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { buildingSchema } from "@/lib/validation/buildings";

export type DeleteBuildingState = { error: string } | undefined;

export type FormActionState = { error: string } | undefined;

function parseBuildingForm(formData: FormData) {
  return buildingSchema.safeParse({
    name: formData.get("name"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
  });
}

export async function createBuilding(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const parsed = parseBuildingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existing = await prisma.building.findFirst({
    where: { organizationId, name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) {
    return { error: "A building with this name already exists." };
  }

  const building = await prisma.building.create({
    data: { organizationId, ...parsed.data },
  });

  redirect(`/dashboard/buildings`);
}

export async function updateBuilding(
  buildingId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const parsed = parseBuildingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existing = await prisma.building.findFirst({
    where: { organizationId, name: { equals: parsed.data.name, mode: "insensitive" }, id: { not: buildingId } },
  });
  if (existing) {
    return { error: "A building with this name already exists." };
  }

  const result = await prisma.building.updateMany({
    where: { id: buildingId, organizationId },
    data: parsed.data,
  });

  if (result.count === 0) {
    return { error: "Building not found." };
  }

  redirect(`/dashboard/buildings`);
}

export async function deleteBuilding(
  buildingId: string,
  _prevState: DeleteBuildingState,
  formData: FormData,
): Promise<DeleteBuildingState> {
  const { organizationId } = await requireAdminOrStaff();

  const building = await prisma.building.findFirst({ where: { id: buildingId, organizationId } });
  if (!building) {
    return { error: "Building not found." };
  }

  const confirmation = formData.get("confirmName");
  if (confirmation !== building.name) {
    return { error: "Type the building name exactly to confirm deletion." };
  }

  await prisma.building.delete({ where: { id: buildingId } });

  redirect("/dashboard/buildings");
}
