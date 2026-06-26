import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sha256 } from "./crypto";
import { SESSION_COOKIE_NAME } from "./session";

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return session;
});

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

// The org-scoping primitive every module's data access builds on. Every
// server action and org-scoped query must go through this rather than
// trusting an organizationId passed in from the client.
export const requireOrgScope = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.emailVerifiedAt) redirect("/verify-email");
  if (!session.activeOrganizationId) redirect("/login");

  const membership = await prisma.orgMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.userId,
        organizationId: session.activeOrganizationId,
      },
    },
  });

  if (!membership) redirect("/login");

  return { user: session.user, organizationId: membership.organizationId, role: membership.role };
});

export async function requireAdminOrStaff() {
  const scope = await requireOrgScope();
  if (scope.role === "RESIDENT") redirect("/dashboard");
  return scope;
}
