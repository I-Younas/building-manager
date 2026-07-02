import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getUnitStatus } from "@/lib/leases/status";
import { CreateLeaseForm } from "@/components/leases/create-lease-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default async function PendingUnitsPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { buildingId } = await params;

  const building = await prisma.building.findFirst({
    where: { id: buildingId, organizationId },
    include: {
      units: {
        include: {
          residentLinks: { include: { user: true }, orderBy: { createdAt: "asc" } },
          leases: { where: { status: "ACTIVE" }, select: { status: true } },
        },
        orderBy: { unitNumber: "asc" },
      },
    },
  });

  if (!building) notFound();

  const now = Date.now();
  const pendingUnits = building.units
    .filter((unit) => getUnitStatus(unit) === "PENDING")
    .map((unit) => {
      const link = unit.residentLinks[0];
      return {
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        unitResidentId: link.id,
        residentName: link.user.name,
        daysSinceSignup: Math.floor((now - link.createdAt.getTime()) / MS_PER_DAY),
      };
    });

  return (
    <div>
      <Link href="/dashboard/buildings" className="text-sm text-blue-600 hover:underline">
        ← Buildings
      </Link>
      <PageHeader title={`${building.name} — Units pending lease setup`} />

      {pendingUnits.length === 0 ? (
        <EmptyState title="No units pending lease setup" />
      ) : (
        <div className="flex flex-col gap-3">
          {pendingUnits.map((unit) => (
            <Card key={unit.unitId}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Link href={`/dashboard/units/${unit.unitId}`} className="font-medium text-blue-600 hover:underline">
                    Unit {unit.unitNumber}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {unit.residentName} · signed up {unit.daysSinceSignup} day{unit.daysSinceSignup === 1 ? "" : "s"} ago
                  </p>
                </div>
              </div>
              <CreateLeaseForm unitResidentId={unit.unitResidentId} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
