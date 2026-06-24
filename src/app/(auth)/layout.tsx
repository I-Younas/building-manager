import { LocaleSwitcher } from "@/components/locale-switcher";
import { getLocale } from "@/lib/i18n/get-dictionary";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Building Manager</p>
          <LocaleSwitcher locale={locale} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
