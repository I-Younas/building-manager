"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { facilitySchema } from "@/lib/validation/facilities";

export type FormActionState = { error: string } | undefined;

function parseFacilityForm(formData: FormData) {
  return facilitySchema.safeParse({
    buildingId: formData.get("buildingId"),
    name: formData.get("name"),
    description: formData.get("description"),
    openTime: formData.get("openTime"),
    closeTime: formData.get("closeTime"),
    minNoticeHours: formData.get("minNoticeHours"),
    maxDurationMinutes: formData.get("maxDurationMinutes"),
  });
}

export async function createFacility(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const parsed = parseFacilityForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  if (parsed.data.openTime >= parsed.data.closeTime) {
    return { error: "Opening time must be before closing time." };
  }

  const building = await prisma.building.findFirst({
    where: { id: parsed.data.buildingId, organizationId },
  });
  if (!building) {
    return { error: "Building not found." };
  }

  const facility = await prisma.facility.create({
    data: {
      organizationId,
      buildingId: parsed.data.buildingId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      requiresApproval: formData.get("requiresApproval") === "on",
      openTime: parsed.data.openTime,
      closeTime: parsed.data.closeTime,
      minNoticeHours: parsed.data.minNoticeHours,
      maxDurationMinutes: parsed.data.maxDurationMinutes,
    },
  });

  redirect(`/dashboard/facilities?created=${facility.id}`);
}

export async function updateFacility(
  facilityId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const existing = await prisma.facility.findFirst({ where: { id: facilityId, organizationId } });
  if (!existing) {
    return { error: "Facility not found." };
  }

  const parsed = parseFacilityForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  if (parsed.data.openTime >= parsed.data.closeTime) {
    return { error: "Opening time must be before closing time." };
  }

  const building = await prisma.building.findFirst({
    where: { id: parsed.data.buildingId, organizationId },
  });
  if (!building) {
    return { error: "Building not found." };
  }

  await prisma.facility.update({
    where: { id: facilityId },
    data: {
      buildingId: parsed.data.buildingId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      requiresApproval: formData.get("requiresApproval") === "on",
      openTime: parsed.data.openTime,
      closeTime: parsed.data.closeTime,
      minNoticeHours: parsed.data.minNoticeHours,
      maxDurationMinutes: parsed.data.maxDurationMinutes,
    },
  });

  redirect("/dashboard/facilities");
}

export async function setFacilityActive(facilityId: string, isActive: boolean) {
  const { organizationId } = await requireAdminOrStaff();

  await prisma.facility.updateMany({
    where: { id: facilityId, organizationId },
    data: { isActive },
  });

  revalidatePath("/dashboard/facilities");
}
