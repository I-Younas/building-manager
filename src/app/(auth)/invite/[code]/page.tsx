import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RedeemInviteForm } from "./redeem-invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const invite = await prisma.inviteCode.findUnique({
    where: { code },
    include: { organization: true, unit: { include: { building: true } } },
  });

  if (!invite) notFound();

  const isExpired = invite.usedAt !== null || invite.expiresAt < new Date();

  if (isExpired) {
    return (
      <div>
        <h1>Invite no longer valid</h1>
        <p>This invite link has already been used or has expired. Ask your building admin for a new one.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Join {invite.organization.name}</h1>
      <p>
        You&apos;ve been invited as {invite.role === "RESIDENT" ? "a resident" : "staff"}
        {invite.unit ? ` of Unit ${invite.unit.unitNumber}, ${invite.unit.building.name}` : ""}.
      </p>
      <RedeemInviteForm code={code} lockedEmail={invite.email} />
    </div>
  );
}
