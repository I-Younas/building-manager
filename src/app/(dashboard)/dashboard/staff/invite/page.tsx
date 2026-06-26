import { requireAdminOrStaff } from "@/lib/auth/dal";
import { StaffInviteForm } from "./invite-form";
import { Card, PageHeader } from "@/components/ui";

export default async function InviteStaffPage() {
  await requireAdminOrStaff();

  return (
    <div>
      <PageHeader title="Invite a staff member" />
      <Card className="max-w-lg">
        <StaffInviteForm />
      </Card>
    </div>
  );
}
