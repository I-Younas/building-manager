"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { announcementSchema } from "@/lib/validation/announcements";

export type FormActionState = { error: string } | undefined;

type ParseAnnouncementResult =
  | { error: string }
  | {
      data: {
        title: string;
        body: string;
        scope: "ORGANIZATION" | "BUILDING";
        buildingId: string | null;
        expiresAt: Date | null;
      };
    };

async function parseAnnouncementForm(
  formData: FormData,
  organizationId: string,
): Promise<ParseAnnouncementResult> {
  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    scope: formData.get("scope"),
    buildingId: formData.get("buildingId") ?? undefined,
    expiresAt: formData.get("expiresAt") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." } as const;
  }

  let buildingId: string | null = null;
  if (parsed.data.scope === "BUILDING") {
    if (!parsed.data.buildingId) {
      return { error: "Select a building for a building-scoped announcement." } as const;
    }
    const building = await prisma.building.findFirst({
      where: { id: parsed.data.buildingId, organizationId },
    });
    if (!building) {
      return { error: "Building not found." } as const;
    }
    buildingId = building.id;
  }

  let expiresAt: Date | null = null;
  if (parsed.data.expiresAt) {
    expiresAt = new Date(parsed.data.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return { error: "Enter a valid expiry date." } as const;
    }
  }

  return {
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      scope: parsed.data.scope,
      buildingId,
      expiresAt,
    },
  } as const;
}

export async function createAnnouncement(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId } = await requireAdminOrStaff();

  const result = await parseAnnouncementForm(formData, organizationId);
  if ("error" in result) {
    return { error: result.error };
  }

  await prisma.announcement.create({
    data: {
      organizationId,
      postedById: user.id,
      ...result.data,
    },
  });

  redirect("/dashboard/announcements");
}

export async function updateAnnouncement(
  announcementId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const existing = await prisma.announcement.findFirst({
    where: { id: announcementId, organizationId },
  });
  if (!existing) {
    return { error: "Announcement not found." };
  }

  const result = await parseAnnouncementForm(formData, organizationId);
  if ("error" in result) {
    return { error: result.error };
  }

  await prisma.announcement.update({
    where: { id: announcementId },
    data: result.data,
  });

  redirect("/dashboard/announcements");
}

export async function deleteAnnouncement(announcementId: string) {
  const { organizationId } = await requireAdminOrStaff();

  await prisma.announcement.deleteMany({ where: { id: announcementId, organizationId } });

  revalidatePath("/dashboard/announcements");
}
