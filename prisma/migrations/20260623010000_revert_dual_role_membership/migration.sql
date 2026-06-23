-- Revert: a user may once again hold only one role per organization.
DROP INDEX "OrgMembership_userId_organizationId_role_key";
CREATE UNIQUE INDEX "OrgMembership_userId_organizationId_key" ON "OrgMembership"("userId", "organizationId");

ALTER TABLE "Session" DROP COLUMN "activeRole";
