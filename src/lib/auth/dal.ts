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

// A user can hold more than one role in the same organization (e.g. an
// ORG_ADMIN who is also a RESIDENT of a unit there, set up for testing).
// When that's the case, a session's chosen activeRole picks which one is in
// effect; absent a choice, the most-privileged role wins.
const ROLE_PRIORITY = { ORG_ADMIN: 0, STAFF: 1, RESIDENT: 2 } as const;

// The org-scoping primitive every module's data access builds on. Every
// server action and org-scoped query must go through this rather than
// trusting an organizationId passed in from the client.
export const requireOrgScope = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.activeOrganizationId) redirect("/login");

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: session.userId, organizationId: session.activeOrganizationId },
  });
  if (memberships.length === 0) redirect("/login");

  const membership =
    memberships.find((m) => m.role === session.activeRole) ??
    [...memberships].sort((a, b) => ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role])[0];

  return {
    user: session.user,
    organizationId: membership.organizationId,
    role: membership.role,
    availableRoles: memberships.map((m) => m.role),
  };
});

export async function requireAdminOrStaff() {
  const scope = await requireOrgScope();
  if (scope.role === "RESIDENT") redirect("/dashboard");
  return scope;
}
