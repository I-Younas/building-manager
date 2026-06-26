import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { removeUnitResident } from "@/lib/actions/units";
import { Button, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { unitId } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, organizationId },
    include: {
      building: true,
      residentLinks: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!unit) notFound();

  return (
    <div>
      <Link href={`/dashboard/buildings/${unit.buildingId}`} className="text-sm text-blue-600 hover:underline">
        ← {unit.building.name}
      </Link>
      <PageHeader
        title={`Unit ${unit.unitNumber}`}
        description={unit.floor ? `Floor ${unit.floor}` : undefined}
        actions={
          <LinkButton
            href={`/dashboard/residents/invite?buildingName=${encodeURIComponent(unit.building.name)}&unitNumber=${encodeURIComponent(unit.unitNumber)}`}
          >
            Invite a resident
          </LinkButton>
        }
      />

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Residents</h2>
      {unit.residentLinks.length === 0 ? (
        <EmptyState title="No residents linked to this unit yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {unit.residentLinks.map((link) => (
            <Card key={link.id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-slate-900">{link.user.name}</p>
                <p className="text-sm text-slate-500">
                  {link.user.email}
                  {link.relationship ? ` · ${link.relationship.replace("_", " ")}` : ""}
                  {link.isPrimary ? " · primary" : ""}
                </p>
              </div>
              <form action={removeUnitResident.bind(null, link.id)}>
                <Button type="submit" variant="danger" size="sm">
                  Remove
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
