"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { generateInviteCode } from "@/lib/auth/crypto";
import { createInviteSchema, redeemInviteSchema, residentRegistrationSchema } from "@/lib/validation/invites";
import { sendInviteEmail, sendUnitSetupNeededEmail } from "@/lib/email";

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
    email: formData.get("email"),
    employeeId: formData.get("employeeId") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { role, email } = parsed.data;
  let unitId: string | null = null;

  if (role === "STAFF" && !parsed.data.employeeId) {
    return { error: "Enter an employee ID for a staff invite." };
  }

  if (role === "RESIDENT") {
    if (!parsed.data.buildingName || !parsed.data.unitNumber) {
      return { error: "Enter a building and a unit number for a resident invite." };
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
  }

  const code = generateInviteCode();

  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });

  await prisma.inviteCode.create({
    data: {
      organizationId,
      code,
      role,
      unitId,
      email,
      employeeId: role === "STAFF" ? parsed.data.employeeId : null,
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
  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "This invite link is invalid or has expired." };
  }

  const parsed = redeemInviteSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  let residentDetails: z.infer<typeof residentRegistrationSchema> | null = null;
  if (invite.role === "RESIDENT") {
    const residentParsed = residentRegistrationSchema.safeParse({
      phone: formData.get("phone"),
      dateOfBirth: formData.get("dateOfBirth"),
      emergencyContactName: formData.get("emergencyContactName"),
      emergencyContactPhone: formData.get("emergencyContactPhone"),
    });
    if (!residentParsed.success) {
      return { error: residentParsed.error.issues[0]?.message ?? "Please check the form and try again." };
    }
    residentDetails = residentParsed.data;
  }

  const { firstName, lastName, email, password } = parsed.data;
  const name = `${firstName} ${lastName}`;

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
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: residentDetails?.phone,
        dateOfBirth: residentDetails ? new Date(residentDetails.dateOfBirth) : undefined,
        emergencyContactName: residentDetails?.emergencyContactName,
        emergencyContactPhone: residentDetails?.emergencyContactPhone,
        // Reaching this page already required the unguessable invite token
        // sent to this address, which is the same trust level as clicking a
        // verification link, so self-serve email verification isn't needed.
        emailVerifiedAt: new Date(),
      },
    });
    userId = user.id;
  }

  if (existingUser && !existingUser.emailVerifiedAt) {
    await prisma.user.update({ where: { id: existingUser.id }, data: { emailVerifiedAt: new Date() } });
  }

  const alreadyMember = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId: invite.organizationId } },
  });
  if (alreadyMember) {
    return { error: "You're already a member of this organization." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.orgMembership.create({
      data: {
        userId,
        organizationId: invite.organizationId,
        role: invite.role,
        employeeId: invite.role === "STAFF" ? invite.employeeId : null,
      },
    });

    if (invite.role === "RESIDENT" && invite.unitId) {
      await tx.unitResident.create({
        data: { unitId: invite.unitId, userId },
      });
    }

    await tx.inviteCode.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedByUserId: userId },
    });
  });

  if (invite.role === "RESIDENT" && invite.unitId) {
    const unit = await prisma.unit.findUnique({ where: { id: invite.unitId }, include: { building: true } });
    const admins = await prisma.orgMembership.findMany({
      where: { organizationId: invite.organizationId, role: "ORG_ADMIN" },
      include: { user: true },
    });
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    if (unit) {
      for (const admin of admins) {
        try {
          await sendUnitSetupNeededEmail({
            to: admin.user.email,
            residentName: name,
            buildingName: unit.building.name,
            unitNumber: unit.unitNumber,
            unitUrl: `${appUrl}/dashboard/units/${unit.id}`,
          });
        } catch (err) {
          console.error("Failed to send unit-setup-needed notification:", err);
        }
      }
    }
  }

  await createSession(userId, invite.organizationId);
  redirect("/dashboard");
}
