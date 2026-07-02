import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LinkButton } from "@/components/ui";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <main className="flex min-h-screen flex-col px-6">
      <nav className="flex items-center justify-between py-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{dict.landing.tagline}</p>
        <LocaleSwitcher locale={locale} />
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-xl text-center">
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{dict.landing.heading}</h1>
          <p className="mt-4 text-lg text-slate-600">{dict.landing.subtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3">
            <LinkButton href="/signup" size="md">
              {dict.landing.signUp}
            </LinkButton>
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
              {dict.landing.signIn}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
