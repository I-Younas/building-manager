"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, setActiveOrganization } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/dal";
import { signupSchema, loginSchema } from "@/lib/validation/auth";

export type AuthActionState = { error: string } | undefined;

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
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { organizationName, name, email, password } = parsed.data;

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
    const user = existingUser ?? (await tx.user.create({ data: { name, email, passwordHash: passwordHash! } }));
    await tx.orgMembership.create({
      data: { userId: user.id, organizationId: organization.id, role: "ORG_ADMIN" },
    });
    return { userId: user.id, organizationId: organization.id };
  });

  await createSession(userId, organizationId);
  redirect("/dashboard");
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

  const { email, password } = parsed.data;

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

  const activeOrganizationId = user.memberships[0]?.organizationId ?? null;
  await createSession(user.id, activeOrganizationId);
  redirect("/dashboard");
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
