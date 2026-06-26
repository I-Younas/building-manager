import { verifyEmail } from "@/lib/actions/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function VerifyEmailTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dict = await getDictionary();

  const result = await verifyEmail(token);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{dict.auth.verifyEmail.expiredTitle}</h1>
      <p className="mt-2 text-sm text-slate-500">{result?.error ?? dict.auth.verifyEmail.expiredDescription}</p>
    </div>
  );
}
