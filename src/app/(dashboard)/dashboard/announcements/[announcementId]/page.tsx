import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import {
  Card,
  LinkButton,
  PageHeader,
  StatusBadge,
  tableClasses,
  tableWrapClasses,
  tdClasses,
  theadClasses,
  thClasses,
  trClasses,
} from "@/components/ui";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}) {
  const { organizationId, role } = await requireOrgScope();
  const isAdmin = role !== "RESIDENT";
  if (!isAdmin) notFound();

  const { announcementId } = await params;

  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, organizationId },
    include: {
      postedBy: true,
      attachments: true,
      deliveries: { include: { user: true }, orderBy: { email: "asc" } },
      acknowledgments: true,
    },
  });
  if (!announcement) notFound();

  const acknowledgedIds = new Set(announcement.acknowledgments.map((a) => a.userId));

  return (
    <div>
      <PageHeader
        title={announcement.title}
        description={`Posted by ${announcement.postedBy.name} · ${formatDateTime(announcement.publishedAt)}`}
        actions={
          <>
            <StatusBadge status={announcement.status} />
            <StatusBadge status={announcement.priority} />
            {announcement.status === "SENT" ? (
              <LinkButton href={`/dashboard/announcements/new?correctsFrom=${announcement.id}`} variant="secondary">
                Send correction
              </LinkButton>
            ) : null}
          </>
        }
      />

      <Card className="mb-8">
        <div className="rich-text-content text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: announcement.body }} />
        {announcement.attachments.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-1">
            {announcement.attachments.map((a) => (
              <li key={a.id}>
                <a href={a.fileUrl} className="text-sm text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                  {a.fileName}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {announcement.correctsAnnouncementId ? (
          <p className="mt-4 text-xs text-slate-500">
            Corrects{" "}
            <Link href={`/dashboard/announcements/${announcement.correctsAnnouncementId}`} className="text-blue-600 hover:underline">
              an earlier announcement
            </Link>
            .
          </p>
        ) : null}
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Delivery</h2>
      {announcement.deliveries.length === 0 ? (
        <p className="text-sm text-slate-500">Not sent yet.</p>
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>Recipient</th>
                <th className={thClasses}>Status</th>
                <th className={thClasses}>Sent</th>
                <th className={thClasses}>Delivered</th>
                <th className={thClasses}>Opened</th>
                <th className={thClasses}>Clicked</th>
                {announcement.requireAcknowledgment ? <th className={thClasses}>Acknowledged</th> : null}
              </tr>
            </thead>
            <tbody>
              {announcement.deliveries.map((d) => (
                <tr key={d.id} className={trClasses}>
                  <td className={tdClasses}>
                    {d.user.name} ({d.email})
                  </td>
                  <td className={tdClasses}>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className={tdClasses}>{d.sentAt ? formatDateTime(d.sentAt) : "—"}</td>
                  <td className={tdClasses}>{d.deliveredAt ? formatDateTime(d.deliveredAt) : "—"}</td>
                  <td className={tdClasses}>{d.openedAt ? formatDateTime(d.openedAt) : "—"}</td>
                  <td className={tdClasses}>{d.clickedAt ? formatDateTime(d.clickedAt) : "—"}</td>
                  {announcement.requireAcknowledgment ? (
                    <td className={tdClasses}>{acknowledgedIds.has(d.userId) ? "Yes" : "No"}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
