import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LinkButton } from "@/components/ui";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="absolute right-6 top-6">
        <LocaleSwitcher locale={locale} />
      </div>
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{dict.landing.tagline}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{dict.landing.heading}</h1>
        <p className="mt-4 text-lg text-slate-600">{dict.landing.subtitle}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <LinkButton href="/signup" size="md">
            {dict.landing.getStarted}
          </LinkButton>
          <LinkButton href="/login" variant="secondary" size="md">
            {dict.landing.logIn}
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
