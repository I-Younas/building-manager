import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { updateFacility } from "@/lib/actions/facilities";
import { FacilityForm } from "../../facility-form";
import { PageHeader } from "@/components/ui";

export default async function EditFacilityPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { facilityId } = await params;

  const facility = await prisma.facility.findFirst({ where: { id: facilityId, organizationId } });
  if (!facility) notFound();

  const buildings = await prisma.building.findMany({ where: { organizationId }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Edit facility" />
      <FacilityForm
        action={updateFacility.bind(null, facilityId)}
        buildings={buildings}
        defaultValues={facility}
        submitLabel="Save changes"
      />
    </div>
  );
}
