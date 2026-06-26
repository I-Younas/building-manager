import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function VacantUnitsPage({
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
        where: { residentLinks: { none: {} } },
        orderBy: { unitNumber: "asc" },
      },
    },
  });

  if (!building) notFound();

  return (
    <div>
      <Link href={`/dashboard/buildings/${building.id}`} className="text-sm text-blue-600 hover:underline">
        ← {building.name}
      </Link>
      <PageHeader title={`${building.name} — Vacant units`} />

      {building.units.length === 0 ? (
        <EmptyState title="No vacant units" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {building.units.map((unit) => (
            <Link key={unit.id} href={`/dashboard/units/${unit.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <p className="font-medium text-slate-900">Unit {unit.unitNumber}</p>
                {unit.floor ? <p className="mt-1 text-sm text-slate-500">Floor {unit.floor}</p> : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
