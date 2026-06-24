import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AddUnitForm } from "./add-unit-form";
import { DeleteBuildingForm } from "./delete-building-form";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const dict = await getDictionary();
  const { buildingId } = await params;

  const building = await prisma.building.findFirst({
    where: { id: buildingId, organizationId },
    include: { units: { orderBy: { unitNumber: "asc" } } },
  });

  if (!building) notFound();

  const residentCount = await prisma.unitResident.count({ where: { unit: { buildingId: building.id } } });

  return (
    <div>
      <PageHeader
        title={building.name}
        description={`${building.addressLine1}${building.addressLine2 ? `, ${building.addressLine2}` : ""}, ${building.city}${building.region ? `, ${building.region}` : ""} ${building.postalCode ?? ""}, ${building.country}`}
        actions={
          <LinkButton href={`/dashboard/buildings/${building.id}/edit`} variant="secondary">
            {dict.common.edit}
          </LinkButton>
        }
      />

      <h2 className="mb-3 text-lg font-semibold text-slate-900">{dict.buildings.units}</h2>
      {building.units.length === 0 ? (
        <EmptyState title={dict.buildings.noUnits} />
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <Card className="mb-8 max-w-lg">
        <h3 className="mb-4 text-base font-semibold text-slate-900">{dict.buildings.addUnit}</h3>
        <AddUnitForm buildingId={building.id} />
      </Card>

      <Card className="max-w-lg border-red-200">
        <h3 className="mb-4 text-base font-semibold text-red-700">{dict.buildings.dangerZone}</h3>
        <DeleteBuildingForm
          buildingId={building.id}
          buildingName={building.name}
          unitCount={building.units.length}
          residentCount={residentCount}
        />
      </Card>
    </div>
  );
}
