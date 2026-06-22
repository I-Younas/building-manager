import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { checkInVisitor, checkOutVisitor, cancelVisitorRegistration } from "@/lib/actions/visitors";
import { Button, Card, EmptyState, inputClasses, LinkButton, PageHeader, StatusBadge } from "@/components/ui";

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user, organizationId, role } = await requireOrgScope();
  const isAdmin = role !== "RESIDENT";
  const { q } = await searchParams;

  let unitIdFilter: { in: string[] } | undefined;
  if (!isAdmin) {
    const myUnits = await prisma.unitResident.findMany({
      where: { userId: user.id, unit: { organizationId } },
      select: { unitId: true },
    });
    unitIdFilter = { in: myUnits.map((link) => link.unitId) };
  }

  const visitors = await prisma.visitor.findMany({
    where: {
      organizationId,
      ...(unitIdFilter ? { unitId: unitIdFilter } : {}),
      ...(isAdmin && q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { unit: { include: { building: true } }, registeredBy: true },
    orderBy: { expectedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Visitors" : "My visitors"}
        actions={<LinkButton href="/dashboard/visitors/new">Register a visitor</LinkButton>}
      />

      {isAdmin ? (
        <form className="mb-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by visitor name"
            className={`${inputClasses} mt-0 max-w-xs`}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      ) : null}

      {visitors.length === 0 ? (
        <EmptyState title="No visitors registered yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {visitors.map((visitor) => (
            <Card key={visitor.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{visitor.name}</p>
                  <p className="text-sm text-slate-500">
                    {visitor.unit.building.name} / Unit {visitor.unit.unitNumber} · Expected{" "}
                    {visitor.expectedAt.toLocaleString()}
                    {visitor.phone ? ` · ${visitor.phone}` : ""}
                    {visitor.purpose ? ` · ${visitor.purpose}` : ""}
                    {isAdmin ? ` · registered by ${visitor.registeredBy.name}` : ""}
                  </p>
                </div>
                <StatusBadge status={visitor.status} />
              </div>

              <div className="mt-3 flex gap-2">
                {isAdmin && visitor.status === "EXPECTED" ? (
                  <form action={checkInVisitor.bind(null, visitor.id)}>
                    <Button type="submit" size="sm">
                      Check in
                    </Button>
                  </form>
                ) : null}
                {isAdmin && visitor.status === "CHECKED_IN" ? (
                  <form action={checkOutVisitor.bind(null, visitor.id)}>
                    <Button type="submit" size="sm">
                      Check out
                    </Button>
                  </form>
                ) : null}
                {visitor.status === "EXPECTED" ? (
                  <form action={cancelVisitorRegistration.bind(null, visitor.id)}>
                    <Button type="submit" variant="danger" size="sm">
                      Cancel
                    </Button>
                  </form>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
