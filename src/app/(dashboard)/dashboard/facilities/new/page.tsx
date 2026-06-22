import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { createFacility } from "@/lib/actions/facilities";
import { FacilityForm } from "../facility-form";

export default async function NewFacilityPage() {
  const { organizationId } = await requireAdminOrStaff();
  const buildings = await prisma.building.findMany({ where: { organizationId }, orderBy: { name: "asc" } });

  return (
    <div>
      <h1>Add facility</h1>
      <FacilityForm action={createFacility} buildings={buildings} submitLabel="Create facility" />
    </div>
  );
}
