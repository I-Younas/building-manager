import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Card, PageHeader, StatusBadge } from "@/components/ui";

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
    },
  });
  if (!announcement) notFound();

  return (
    <div>
      <PageHeader
        title={announcement.title}
        description={`Posted by ${announcement.postedBy.name} · ${formatDateTime(announcement.publishedAt)}`}
        actions={
          <>
            <StatusBadge status={announcement.status} />
            <StatusBadge status={announcement.priority} />
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

    </div>
  );
}
