import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { setFacilityActive } from "@/lib/actions/facilities";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function FacilitiesPage() {
  const { organizationId, role } = await requireOrgScope();
  const isAdmin = role !== "RESIDENT";

  const facilities = await prisma.facility.findMany({
    where: { organizationId, ...(isAdmin ? {} : { isActive: true }) },
    include: { building: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Facilities"
        actions={
          <>
            <LinkButton href="/dashboard/facilities/bookings" variant="secondary">
              {isAdmin ? "Bookings" : "My bookings"}
            </LinkButton>
            {isAdmin ? <LinkButton href="/dashboard/facilities/new">Add facility</LinkButton> : null}
          </>
        }
      />

      {facilities.length === 0 ? (
        <EmptyState title="No facilities yet" />
      ) : (
        <div className="flex flex-col gap-4">
          {facilities.map((facility) => (
            <Card key={facility.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{facility.name}</p>
                    {!facility.isActive ? <Badge tone="neutral">Inactive</Badge> : null}
                  </div>
                  <p className="text-sm text-slate-500">{facility.building.name}</p>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <LinkButton href={`/dashboard/facilities/${facility.id}/edit`} variant="secondary" size="sm">
                      Edit
                    </LinkButton>
                    <form action={setFacilityActive.bind(null, facility.id, !facility.isActive)}>
                      <Button type="submit" variant="secondary" size="sm">
                        {facility.isActive ? "Deactivate" : "Reactivate"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <LinkButton href={`/dashboard/facilities/bookings/new?facilityId=${facility.id}`} size="sm">
                    Book this facility
                  </LinkButton>
                )}
              </div>

              {facility.description ? <p className="mt-3 text-sm text-slate-600">{facility.description}</p> : null}

              <p className="mt-3 text-xs text-slate-500">
                Open {facility.openTime}–{facility.closeTime} · max {facility.maxDurationMinutes} min · requires{" "}
                {facility.minNoticeHours}h notice · {facility.requiresApproval ? "needs approval" : "auto-approved"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
