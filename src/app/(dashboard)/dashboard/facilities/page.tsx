import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { setFacilityActive } from "@/lib/actions/facilities";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Facilities</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard/facilities/bookings">{isAdmin ? "Bookings" : "My bookings"}</Link>
          {isAdmin ? <Link href="/dashboard/facilities/new">Add facility</Link> : null}
        </div>
      </div>

      {facilities.length === 0 ? (
        <p>No facilities yet.</p>
      ) : (
        <ul>
          {facilities.map((facility) => (
            <li key={facility.id} style={{ marginBottom: 16 }}>
              <strong>{facility.name}</strong> — {facility.building.name}
              {!facility.isActive ? " (inactive)" : ""}
              <br />
              {facility.description ? (
                <>
                  {facility.description}
                  <br />
                </>
              ) : null}
              Open {facility.openTime}–{facility.closeTime} · max {facility.maxDurationMinutes} min · requires{" "}
              {facility.minNoticeHours}h notice ·{" "}
              {facility.requiresApproval ? "needs approval" : "auto-approved"}
              <br />
              {isAdmin ? (
                <>
                  <Link href={`/dashboard/facilities/${facility.id}/edit`}>Edit</Link>{" "}
                  <form
                    action={setFacilityActive.bind(null, facility.id, !facility.isActive)}
                    style={{ display: "inline" }}
                  >
                    <button type="submit">{facility.isActive ? "Deactivate" : "Reactivate"}</button>
                  </form>
                </>
              ) : (
                <Link href={`/dashboard/facilities/bookings/new?facilityId=${facility.id}`}>
                  Book this facility
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
