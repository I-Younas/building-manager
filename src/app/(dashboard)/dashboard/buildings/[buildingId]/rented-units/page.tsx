import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function RentedUnitsPage({
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
        where: { residentLinks: { some: {} } },
        include: { residentLinks: { include: { user: true }, orderBy: { createdAt: "asc" } } },
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
      <PageHeader title={`${building.name} — Rented units`} />

      {building.units.length === 0 ? (
        <EmptyState title="No rented units yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {building.units.map((unit) => (
            <Card key={unit.id}>
              <Link
                href={`/dashboard/units/${unit.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                Unit {unit.unitNumber}
              </Link>
              <div className="mt-2 flex flex-col gap-2">
                {unit.residentLinks.map((link) => (
                  <div key={link.id} className="text-sm text-slate-600">
                    <p className="text-slate-900">{link.user.name}</p>
                    <p>
                      Lease: {link.leaseStartDate ? link.leaseStartDate.toLocaleDateString() : "—"} –{" "}
                      {link.leaseEndDate ? link.leaseEndDate.toLocaleDateString() : "—"}
                      {" · "}
                      {link.renewalSigned ? "Renewal signed" : "Renewal not signed"}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
