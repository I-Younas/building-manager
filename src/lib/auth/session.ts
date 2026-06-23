import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { OrgRole } from "@/generated/prisma/client";
import { generateSessionToken, sha256 } from "./crypto";

export const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(
  userId: string,
  activeOrganizationId: string | null,
  activeRole?: OrgRole | null,
) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      activeOrganizationId,
      activeRole: activeRole ?? null,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function setActiveOrganization(organizationId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;
  await prisma.session.updateMany({
    where: { tokenHash: sha256(token) },
    // Switching orgs invalidates any explicitly-chosen role from the
    // previous org — requireOrgScope falls back to auto-picking one.
    data: { activeOrganizationId: organizationId, activeRole: null },
  });
}

export async function setActiveRole(role: OrgRole) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;
  await prisma.session.updateMany({
    where: { tokenHash: sha256(token) },
    data: { activeRole: role },
  });
}
