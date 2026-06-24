"use server";

import { redirect } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { generateInviteCode } from "@/lib/auth/crypto";
import { createInviteSchema, redeemInviteSchema } from "@/lib/validation/invites";
import { sendInviteEmail } from "@/lib/email";

const INVITE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type CreateInviteState = { error: string } | { code: string; emailSent: boolean } | undefined;

export async function createInviteCode(
  _prevState: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const { user, organizationId } = await requireAdminOrStaff();

  const parsed = createInviteSchema.safeParse({
    role: formData.get("role"),
    buildingName: formData.get("buildingName") ?? undefined,
    unitNumber: formData.get("unitNumber") ?? undefined,
    relationship: formData.get("relationship") ?? undefined,
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { role, email } = parsed.data;
  let unitId: string | null = null;
  let relationship: "OWNER" | "TENANT" | "FAMILY_MEMBER" | "OTHER" | null = null;

  if (role === "RESIDENT") {
    if (!parsed.data.buildingName || !parsed.data.unitNumber || !parsed.data.relationship) {
      return { error: "Enter a building, a unit number, and choose a relationship for a resident invite." };
    }

    let building = await prisma.building.findFirst({
      where: { organizationId, name: { equals: parsed.data.buildingName, mode: "insensitive" } },
    });
    if (!building) {
      building = await prisma.building.create({
        data: {
          organizationId,
          name: parsed.data.buildingName,
          addressLine1: "",
          city: "",
          country: "",
        },
      });
    }

    const unit = await prisma.unit.upsert({
      where: { buildingId_unitNumber: { buildingId: building.id, unitNumber: parsed.data.unitNumber } },
      create: { organizationId, buildingId: building.id, unitNumber: parsed.data.unitNumber },
      update: {},
    });
    unitId = unit.id;
    relationship = parsed.data.relationship;
  }

  const code = generateInviteCode();

  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });

  await prisma.inviteCode.create({
    data: {
      organizationId,
      code,
      role,
      unitId,
      relationship,
      email,
      createdById: user.id,
      expiresAt: new Date(Date.now() + INVITE_DURATION_MS),
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  let emailSent = false;
  try {
    await sendInviteEmail({
      to: email,
      organizationName: organization?.name ?? "your organization",
      inviteUrl: `${appUrl}/invite/${code}`,
    });
    emailSent = true;
  } catch (err) {
    console.error("Failed to send invite email:", err);
  }

  return { code, emailSent };
}

export type RedeemInviteState = { error: string } | undefined;

export async function redeemInvite(
  code: string,
  _prevState: RedeemInviteState,
  formData: FormData,
): Promise<RedeemInviteState> {
  const parsed = redeemInviteSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { firstName, lastName, email, password } = parsed.data;
  const name = `${firstName} ${lastName}`;

  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "This invite link is invalid or has expired." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  let userId: string;
  if (existingUser) {
    if (!existingUser.isActive) {
      return { error: "This account has been deactivated." };
    }
    const valid = await verifyPassword(password, existingUser.passwordHash);
    if (!valid) {
      return {
        error: "An account with this email already exists. Enter its existing password to join.",
      };
    }
    userId = existingUser.id;
  } else {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    userId = user.id;
  }

  const alreadyMember = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId: invite.organizationId } },
  });
  if (alreadyMember) {
    return { error: "You're already a member of this organization." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.orgMembership.create({
      data: { userId, organizationId: invite.organizationId, role: invite.role },
    });

    if (invite.role === "RESIDENT" && invite.unitId && invite.relationship) {
      await tx.unitResident.create({
        data: {
          unitId: invite.unitId,
          userId,
          relationship: invite.relationship,
        },
      });
    }

    await tx.inviteCode.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedByUserId: userId },
    });
  });

  await createSession(userId, invite.organizationId);
  redirect("/dashboard");
}
