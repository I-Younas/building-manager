import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/auth/crypto";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dict = await getDictionary();

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  const isValid = resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

  if (!isValid) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{dict.auth.resetPassword.expiredTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">{dict.auth.resetPassword.expiredDescription}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{dict.auth.resetPassword.title}</h1>
      <div className="mt-6">
        <ResetPasswordForm token={token} dict={dict.auth.resetPassword} />
      </div>
    </div>
  );
}
