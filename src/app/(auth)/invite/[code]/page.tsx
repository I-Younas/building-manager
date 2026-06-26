import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDictionary, formatMessage } from "@/lib/i18n/get-dictionary";
import { RedeemInviteForm } from "./redeem-invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const dict = await getDictionary();

  const invite = await prisma.inviteCode.findUnique({
    where: { code },
    include: { organization: true, unit: { include: { building: true } } },
  });

  if (!invite) notFound();

  const isExpired = invite.usedAt !== null || invite.expiresAt < new Date();

  if (isExpired) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{dict.auth.invite.expiredTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">{dict.auth.invite.expiredDescription}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">
        {formatMessage(dict.auth.invite.joinOrg, { orgName: invite.organization.name })}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {invite.role === "RESIDENT" ? dict.auth.invite.invitedAsResident : dict.auth.invite.invitedAsStaff}
        {invite.unit ? ` of Unit ${invite.unit.unitNumber}, ${invite.unit.building.name}` : ""}.
      </p>
      <div className="mt-6">
        <RedeemInviteForm code={code} isResident={invite.role === "RESIDENT"} dict={dict.auth.invite} />
      </div>
    </div>
  );
}
