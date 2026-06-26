"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, setActiveOrganization } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/dal";
import { generatePasswordResetToken, generateEmailVerificationToken, sha256 } from "@/lib/auth/crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import {
  signupSchema,
  loginSchema,
  staffLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

export type AuthActionState = { error: string } | undefined;

const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000;
const VERIFICATION_TOKEN_DURATION_MS = 60 * 60 * 1000;
const FORGOT_PASSWORD_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

async function sendEmailVerification(userId: string, email: string) {
  const token = generateEmailVerificationToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_DURATION_MS),
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  try {
    await sendVerificationEmail({ to: email, verifyUrl: `${appUrl}/verify-email/${token}` });
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uniqueOrgSlug(name: string) {
  const base = slugify(name) || "org";
  let slug = base;
  let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

export async function signupOrgAdmin(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    organizationName: formData.get("organizationName"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { organizationName, firstName, lastName, email, phone, password } = parsed.data;
  const name = `${firstName} ${lastName}`;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (!existingUser.isActive) {
      return { error: "This account has been deactivated." };
    }
    const valid = await verifyPassword(password, existingUser.passwordHash);
    if (!valid) {
      return {
        error: "An account with this email already exists. Enter its existing password to create another organization under it.",
      };
    }
  }

  const passwordHash = existingUser ? null : await hashPassword(password);
  const slug = await uniqueOrgSlug(organizationName);

  const { userId, organizationId } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: organizationName, slug },
    });
    const user =
      existingUser ?? (await tx.user.create({ data: { name, email, phone, passwordHash: passwordHash! } }));
    await tx.orgMembership.create({
      data: { userId: user.id, organizationId: organization.id, role: "ORG_ADMIN" },
    });
    return { userId: user.id, organizationId: organization.id };
  });

  if (!existingUser) {
    await sendEmailVerification(userId, email);
  }

  await createSession(userId, organizationId);
  redirect(existingUser?.emailVerifiedAt ? "/dashboard" : "/verify-email");
}

async function authenticateForRole(
  email: string,
  password: string,
  role: "ORG_ADMIN" | "STAFF" | "RESIDENT",
  wrongRoleMessage: string,
  employeeId?: string,
): Promise<AuthActionState> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { orderBy: { createdAt: "asc" } } },
  });

  if (!user || !user.isActive) {
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const membership = user.memberships.find((m) => m.role === role);
  if (!membership) {
    return { error: wrongRoleMessage };
  }

  if (employeeId !== undefined && membership.employeeId !== employeeId) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id, membership.organizationId);
  redirect(user.emailVerifiedAt ? "/dashboard" : "/verify-email");
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  return authenticateForRole(
    parsed.data.email,
    parsed.data.password,
    "ORG_ADMIN",
    "This account isn't an organization admin. Use the resident or staff login page instead.",
  );
}

export async function residentLogin(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  return authenticateForRole(
    parsed.data.email,
    parsed.data.password,
    "RESIDENT",
    "This account isn't a resident account. Use the organization admin or staff login page instead.",
  );
}

export async function staffLogin(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = staffLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    employeeId: formData.get("employeeId"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  return authenticateForRole(
    parsed.data.email,
    parsed.data.password,
    "STAFF",
    "This account isn't a staff account. Use the organization admin or resident login page instead.",
    parsed.data.employeeId,
  );
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function switchActiveOrganization(organizationId: string) {
  const user = await requireUser();

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  });

  if (!membership) {
    throw new Error("Not a member of this organization");
  }

  await setActiveOrganization(organizationId);
  redirect("/dashboard");
}

export type ResendVerificationState = { sent: boolean } | undefined;

export async function resendVerificationEmail(
  _prevState: ResendVerificationState,
  _formData: FormData,
): Promise<ResendVerificationState> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) {
    await sendEmailVerification(user.id, user.email);
  }
  return { sent: true };
}

export async function verifyEmail(token: string): Promise<AuthActionState> {
  const verificationToken = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt < new Date()) {
    return { error: "This verification link is invalid or has expired." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: verificationToken.userId }, data: { emailVerifiedAt: new Date() } });
    await tx.emailVerificationToken.update({ where: { id: verificationToken.id }, data: { usedAt: new Date() } });
  });

  redirect("/dashboard");
}

export type ForgotPasswordState = { message: string } | undefined;

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  // Always return the same message whether or not the email matched an
  // account, so this can't be used to enumerate registered emails.
  if (!parsed.success) {
    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && user.isActive) {
    const token = generatePasswordResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
      },
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    try {
      await sendPasswordResetEmail({ to: user.email, resetUrl: `${appUrl}/reset-password/${token}` });
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  }

  return { message: FORGOT_PASSWORD_MESSAGE };
}

export async function resetPassword(
  token: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This password reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
    await tx.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });
    // Resetting a password invalidates every existing session for the account.
    await tx.session.deleteMany({ where: { userId: resetToken.userId } });
  });

  redirect("/login");
}
