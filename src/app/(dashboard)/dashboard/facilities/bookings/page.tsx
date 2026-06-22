import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { cancelBooking } from "@/lib/actions/bookings";
import { DecisionForms } from "./decision-forms";

function formatRange(start: Date, end: Date) {
  return `${start.toLocaleString()} – ${end.toLocaleTimeString()}`;
}

export default async function BookingsPage() {
  const { user, organizationId, role } = await requireOrgScope();
  const isAdmin = role !== "RESIDENT";

  const bookings = await prisma.facilityBooking.findMany({
    where: {
      organizationId,
      ...(isAdmin ? {} : { requestedById: user.id }),
    },
    include: { facility: { include: { building: true } }, unit: true, requestedBy: true },
    orderBy: [{ status: "asc" }, { startsAt: "asc" }],
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>{isAdmin ? "Facility bookings" : "My bookings"}</h1>
        <Link href="/dashboard/facilities">Browse facilities</Link>
      </div>

      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <ul>
          {bookings.map((booking) => {
            const canCancel =
              (booking.status === "PENDING" || booking.status === "APPROVED") &&
              (isAdmin || booking.requestedById === user.id);

            return (
              <li key={booking.id} style={{ marginBottom: 16 }}>
                <strong>{booking.facility.name}</strong> ({booking.facility.building.name}) — Unit{" "}
                {booking.unit.unitNumber}
                <br />
                {formatRange(booking.startsAt, booking.endsAt)} · {booking.status}
                {isAdmin ? ` · requested by ${booking.requestedBy.name}` : ""}
                {booking.notes ? (
                  <>
                    <br />
                    Note: {booking.notes}
                  </>
                ) : null}
                <br />
                {isAdmin && booking.status === "PENDING" ? <DecisionForms bookingId={booking.id} /> : null}
                {canCancel ? (
                  <form action={cancelBooking.bind(null, booking.id)} style={{ display: "inline" }}>
                    <button type="submit">Cancel</button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
