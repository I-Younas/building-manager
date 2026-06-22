import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { checkInVisitor, checkOutVisitor, cancelVisitorRegistration } from "@/lib/actions/visitors";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>{isAdmin ? "Visitors" : "My visitors"}</h1>
        <Link href="/dashboard/visitors/new">Register a visitor</Link>
      </div>

      {isAdmin ? (
        <form style={{ marginBottom: 16 }}>
          <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search by visitor name" />
          <button type="submit">Search</button>
        </form>
      ) : null}

      {visitors.length === 0 ? (
        <p>No visitors registered yet.</p>
      ) : (
        <ul>
          {visitors.map((visitor) => (
            <li key={visitor.id} style={{ marginBottom: 12 }}>
              <strong>{visitor.name}</strong> — {visitor.unit.building.name} / Unit {visitor.unit.unitNumber}
              <br />
              Expected {visitor.expectedAt.toLocaleString()} · {visitor.status}
              {visitor.phone ? ` · ${visitor.phone}` : ""}
              {visitor.purpose ? ` · ${visitor.purpose}` : ""}
              {isAdmin ? ` · registered by ${visitor.registeredBy.name}` : ""}
              <br />
              {isAdmin && visitor.status === "EXPECTED" ? (
                <form action={checkInVisitor.bind(null, visitor.id)} style={{ display: "inline" }}>
                  <button type="submit">Check in</button>
                </form>
              ) : null}{" "}
              {isAdmin && visitor.status === "CHECKED_IN" ? (
                <form action={checkOutVisitor.bind(null, visitor.id)} style={{ display: "inline" }}>
                  <button type="submit">Check out</button>
                </form>
              ) : null}{" "}
              {visitor.status === "EXPECTED" ? (
                <form action={cancelVisitorRegistration.bind(null, visitor.id)} style={{ display: "inline" }}>
                  <button type="submit">Cancel</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
