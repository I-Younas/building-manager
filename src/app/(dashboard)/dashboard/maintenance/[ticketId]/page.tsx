import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { StatusForm } from "./status-form";
import { AssignForm } from "./assign-form";
import { CommentForm } from "./comment-form";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { user, organizationId, role } = await requireOrgScope();
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
      <p>
        {isStaffOrAdmin ? (
          <Link href={`/dashboard/units/${ticket.unitId}`}>
            {ticket.unit.building.name} / Unit {ticket.unit.unitNumber}
          </Link>
        ) : (
          <>
            {ticket.unit.building.name} / Unit {ticket.unit.unitNumber}
          </>
        )}
      </p>
      <h1>{ticket.title}</h1>
      <p>
        Status: {ticket.status} · Priority: {ticket.priority}
        {ticket.category ? ` · Category: ${ticket.category}` : ""}
      </p>
      <p>Reported by {ticket.reportedBy.name}</p>
      {ticket.assignedTo ? <p>Assigned to {ticket.assignedTo.name}</p> : null}
      <p style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</p>

      {isStaffOrAdmin ? (
        <>
          <h2>Update status</h2>
          <StatusForm ticketId={ticket.id} currentStatus={ticket.status} />

          <h2>Assign</h2>
          <AssignForm ticketId={ticket.id} staff={staffOptions} currentAssigneeId={ticket.assignedToId} />
        </>
      ) : null}

      <h2>Status history</h2>
      <ul>
        {ticket.statusHistory.map((entry) => (
          <li key={entry.id}>
            {entry.fromStatus ? `${entry.fromStatus} → ${entry.toStatus}` : entry.toStatus} by{" "}
            {entry.changedBy.name}
            {entry.note ? `: ${entry.note}` : ""}
          </li>
        ))}
      </ul>

      <h2>Comments</h2>
      {visibleComments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <ul>
          {visibleComments.map((comment) => (
            <li key={comment.id}>
              <strong>{comment.author.name}</strong>
              {comment.isInternal ? " (internal)" : ""}: {comment.body}
            </li>
          ))}
        </ul>
      )}
      <CommentForm ticketId={ticket.id} canMarkInternal={isStaffOrAdmin} />
    </div>
  );
}
