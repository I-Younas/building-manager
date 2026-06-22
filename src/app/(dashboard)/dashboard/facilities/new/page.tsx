import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { createFacility } from "@/lib/actions/facilities";
import { FacilityForm } from "../facility-form";
import { PageHeader } from "@/components/ui";

export default async function NewFacilityPage() {
  const { organizationId } = await requireAdminOrStaff();
  const buildings = await prisma.building.findMany({ where: { organizationId }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Add facility" />
      <FacilityForm action={createFacility} buildings={buildings} submitLabel="Create facility" />
    </div>
  );
}
