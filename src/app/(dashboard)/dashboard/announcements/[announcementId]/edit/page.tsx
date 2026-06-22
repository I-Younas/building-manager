import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { updateAnnouncement } from "@/lib/actions/announcements";
import { AnnouncementForm } from "../../announcement-form";
import { PageHeader } from "@/components/ui";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { announcementId } = await params;

  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, organizationId },
  });
  if (!announcement) notFound();

  const buildings = await prisma.building.findMany({ where: { organizationId }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Edit announcement" />
      <AnnouncementForm
        action={updateAnnouncement.bind(null, announcementId)}
        buildings={buildings}
        defaultValues={announcement}
        submitLabel="Save changes"
      />
    </div>
  );
}
