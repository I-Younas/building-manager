import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { cancelBooking } from "@/lib/actions/bookings";
import { DecisionForms } from "./decision-forms";
import { Button, Card, EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";

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
      <PageHeader
        title={isAdmin ? "Facility bookings" : "My bookings"}
        actions={
          <LinkButton href="/dashboard/facilities" variant="secondary">
            Browse facilities
          </LinkButton>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" />
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => {
            const canCancel =
              (booking.status === "PENDING" || booking.status === "APPROVED") &&
              (isAdmin || booking.requestedById === user.id);

            return (
              <Card key={booking.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {booking.facility.name} ({booking.facility.building.name})
                    </p>
                    <p className="text-sm text-slate-500">
                      Unit {booking.unit.unitNumber} · {formatRange(booking.startsAt, booking.endsAt)}
                      {isAdmin ? ` · requested by ${booking.requestedBy.name}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                {booking.notes ? <p className="mt-2 text-sm text-slate-600">Note: {booking.notes}</p> : null}

                {isAdmin && booking.status === "PENDING" ? (
                  <div className="mt-3">
                    <DecisionForms bookingId={booking.id} />
                  </div>
                ) : null}
                {canCancel ? (
                  <form action={cancelBooking.bind(null, booking.id)} className="mt-3">
                    <Button type="submit" variant="danger" size="sm">
                      Cancel
                    </Button>
                  </form>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
