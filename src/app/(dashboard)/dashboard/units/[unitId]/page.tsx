import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { removeUnitResident } from "@/lib/actions/units";
import { startRenewal, markNotRenewing } from "@/lib/actions/leases";
import { getLeaseDisplayStatus, getRenewalChain } from "@/lib/leases/status";
import { CreateLeaseForm } from "@/components/leases/create-lease-form";
import { ConfirmRenewalForm } from "./confirm-renewal-form";
import { Button, Card, EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";

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
      leases: { orderBy: { leaseStartDate: "desc" }, include: { primaryResident: true } },
    },
  });

  if (!unit) notFound();

  const activeLease = unit.leases.find((lease) => lease.status === "ACTIVE") ?? null;
  const leaseRows = await Promise.all(
    unit.leases.map(async (lease) => {
      const { renewed, renewalCount } = await getRenewalChain(lease.id);
      return { lease, renewed, renewalCount };
    }),
  );

  const primaryLink = unit.residentLinks.find((link) => link.isPrimary) ?? unit.residentLinks[0] ?? null;
  const showCreateLeaseForm = !activeLease && primaryLink;

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
        <div className="mb-8 flex flex-col gap-3">
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

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Lease</h2>

      {showCreateLeaseForm ? (
        <Card className="mb-8">
          <p className="mb-3 text-sm text-slate-600">
            {primaryLink!.user.name} has completed signup. Enter lease details to finalize this unit as rented.
          </p>
          <CreateLeaseForm unitResidentId={primaryLink!.id} />
        </Card>
      ) : null}

      {unit.leases.length === 0 && !showCreateLeaseForm ? (
        <EmptyState title="No lease history for this unit" />
      ) : (
        <div className="flex flex-col gap-3">
          {leaseRows.map(({ lease, renewed, renewalCount }) => {
            const isActive = lease.status === "ACTIVE";
            const displayStatus = isActive ? getLeaseDisplayStatus(lease) : lease.status;
            return (
              <Card key={lease.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{lease.primaryResident.name}</p>
                    <p className="text-sm text-slate-500">
                      {lease.leaseStartDate.toLocaleDateString()} – {lease.leaseEndDate.toLocaleDateString()}
                      {" · "}
                      {renewed ? `Renewal #${renewalCount}` : "Original lease"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={displayStatus} />
                    {lease.renewalStatus ? <StatusBadge status={lease.renewalStatus} /> : null}
                  </div>
                </div>

                {isActive && lease.renewalStatus === "PENDING_DECISION" ? (
                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    <form action={startRenewal.bind(null, lease.id)}>
                      <Button type="submit" size="sm">
                        Start renewal
                      </Button>
                    </form>
                    <form action={markNotRenewing.bind(null, lease.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        Mark not renewing
                      </Button>
                    </form>
                  </div>
                ) : null}

                {isActive && lease.renewalStatus === "RENEWAL_IN_PROGRESS" ? (
                  <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3">
                    <ConfirmRenewalForm leaseId={lease.id} />
                    <form action={markNotRenewing.bind(null, lease.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        Mark not renewing instead
                      </Button>
                    </form>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
