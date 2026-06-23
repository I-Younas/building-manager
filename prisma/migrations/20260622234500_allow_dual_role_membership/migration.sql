-- Allow the same user to hold more than one role (e.g. ORG_ADMIN and RESIDENT)
-- within the same organization, by scoping the uniqueness of OrgMembership to
-- (userId, organizationId, role) instead of (userId, organizationId).
DROP INDEX "OrgMembership_userId_organizationId_key";
CREATE UNIQUE INDEX "OrgMembership_userId_organizationId_role_key" ON "OrgMembership"("userId", "organizationId", "role");

-- Tracks which of a user's roles in the active organization the current
-- session is acting as, so a dual-role user can switch between views.
ALTER TABLE "Session" ADD COLUMN "activeRole" "OrgRole";
