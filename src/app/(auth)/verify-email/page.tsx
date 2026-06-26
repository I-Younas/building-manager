import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getDictionary, formatMessage } from "@/lib/i18n/get-dictionary";
import { ResendVerificationForm } from "./resend-verification-form";

export default async function VerifyEmailPage() {
  const user = await requireUser();
  if (user.emailVerifiedAt) redirect("/dashboard");

  const dict = await getDictionary();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900">{dict.auth.verifyEmail.title}</h1>
      <p className="text-sm text-slate-500">{formatMessage(dict.auth.verifyEmail.body, { email: user.email })}</p>
      <ResendVerificationForm dict={dict.auth.verifyEmail} />
    </div>
  );
}
