import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { markTicketResolved } from "@/lib/actions/maintenance";
import { StatusForm } from "./status-form";
import { AssignForm } from "./assign-form";
import { CommentForm } from "./comment-form";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { user, organizationId, role } = await requireOrgScope();
  const dict = await getDictionary();
  const { ticketId } = await params;

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: ticketId, organizationId },
    include: {
      unit: { include: { building: true } },
      reportedBy: true,
      assignedTo: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) notFound();

  const isStaffOrAdmin = role !== "RESIDENT";

  if (!isStaffOrAdmin) {
    const isReporter = ticket.reportedById === user.id;
    const isUnitMember = isReporter
      ? true
      : Boolean(
          await prisma.unitResident.findUnique({
            where: { unitId_userId: { unitId: ticket.unitId, userId: user.id } },
          }),
        );
    if (!isUnitMember) notFound();
  }

  const visibleComments = isStaffOrAdmin ? ticket.comments : ticket.comments.filter((c) => !c.isInternal);

  let staffOptions: { id: string; name: string }[] = [];
  if (isStaffOrAdmin) {
    const staffMemberships = await prisma.orgMembership.findMany({
      where: { organizationId, role: { in: ["STAFF", "ORG_ADMIN"] } },
      include: { user: true },
    });
    staffOptions = staffMemberships.map((m) => ({ id: m.user.id, name: m.user.name }));
  }

  return (
    <div>
      {isStaffOrAdmin ? (
        <Link href={`/dashboard/units/${ticket.unitId}`} className="text-sm text-blue-600 hover:underline">
          {ticket.unit.building.name} / Unit {ticket.unit.unitNumber}
        </Link>
      ) : (
        <p className="text-sm text-slate-500">
          {ticket.unit.building.name} / Unit {ticket.unit.unitNumber}
        </p>
      )}

      <PageHeader
        title={ticket.title}
        description={`Reported by ${ticket.reportedBy.name}${ticket.assignedTo ? ` · Assigned to ${ticket.assignedTo.name}` : ""}`}
        actions={
          <>
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
            {ticket.category ? <StatusBadge status={ticket.category} /> : null}
          </>
        }
      />

      <Card className="mb-8">
        <p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
      </Card>

      <Card className="mb-8">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">{dict.maintenance.reported}</dt>
            <dd className="text-slate-900">{formatDateTime(ticket.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{dict.maintenance.lastUpdated}</dt>
            <dd className="text-slate-900">{formatDateTime(ticket.updatedAt)}</dd>
          </div>
          {ticket.assignedAt ? (
            <div>
              <dt className="text-slate-500">{dict.maintenance.assigned}</dt>
              <dd className="text-slate-900">{formatDateTime(ticket.assignedAt)}</dd>
            </div>
          ) : null}
          {ticket.resolvedAt ? (
            <div>
              <dt className="text-slate-500">{dict.maintenance.resolved}</dt>
              <dd className="text-slate-900">{formatDateTime(ticket.resolvedAt)}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {isStaffOrAdmin ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">{dict.maintenance.updateStatus}</h2>
              {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" ? (
                <form action={markTicketResolved.bind(null, ticket.id)}>
                  <Button type="submit" variant="secondary" size="sm">
                    {dict.maintenance.markResolved}
                  </Button>
                </form>
              ) : null}
            </div>
            <StatusForm ticketId={ticket.id} currentStatus={ticket.status} />
          </Card>
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{dict.maintenance.assign}</h2>
            <AssignForm ticketId={ticket.id} staff={staffOptions} currentAssigneeId={ticket.assignedToId} />
          </Card>
        </div>
      ) : null}

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Status history</h2>
      <ul className="mb-8 flex flex-col gap-2 text-sm text-slate-600">
        {ticket.statusHistory.map((entry) => (
          <li key={entry.id}>
            {entry.fromStatus ? `${entry.fromStatus} → ${entry.toStatus}` : entry.toStatus} by{" "}
            {entry.changedBy.name}
            {entry.note ? `: ${entry.note}` : ""}
          </li>
        ))}
      </ul>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Comments</h2>
      {visibleComments.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">No comments yet.</p>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {visibleComments.map((comment) => (
            <Card key={comment.id} className="py-3">
              <p className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">{comment.author.name}</span>
                {comment.isInternal ? " (internal)" : ""}: {comment.body}
              </p>
            </Card>
          ))}
        </div>
      )}
      <CommentForm ticketId={ticket.id} canMarkInternal={isStaffOrAdmin} />
    </div>
  );
}
