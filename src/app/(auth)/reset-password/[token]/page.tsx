import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/auth/crypto";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  const isValid = resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

  if (!isValid) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reset link no longer valid</h1>
        <p className="mt-2 text-sm text-slate-500">
          This password reset link has already been used or has expired. Request a new one from the login page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Choose a new password</h1>
      <div className="mt-6">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
