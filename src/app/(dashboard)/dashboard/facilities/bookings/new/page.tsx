import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { BookingForm } from "./booking-form";
import { PageHeader } from "@/components/ui";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ facilityId?: string }>;
}) {
  const { user, organizationId } = await requireOrgScope();
  const { facilityId } = await searchParams;

  const [facilities, unitLinks] = await Promise.all([
    prisma.facility.findMany({
      where: { organizationId, isActive: true },
      include: { building: true },
      orderBy: { name: "asc" },
    }),
    prisma.unitResident.findMany({
      where: { userId: user.id, unit: { organizationId } },
      include: { unit: { include: { building: true } } },
    }),
  ]);

  if (unitLinks.length === 0) {
    return (
      <div>
        <PageHeader title="Request a booking" />
        <p className="text-sm text-slate-500">
          You need to be linked to a unit before you can book a facility. Contact your building admin.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Request a booking" />
      <BookingForm
        facilities={facilities.map((facility) => ({
          id: facility.id,
          name: facility.name,
          buildingName: facility.building.name,
        }))}
        units={unitLinks.map((link) => ({
          id: link.unit.id,
          unitNumber: link.unit.unitNumber,
          buildingName: link.unit.building.name,
        }))}
        defaultFacilityId={facilityId}
      />
    </div>
  );
}
