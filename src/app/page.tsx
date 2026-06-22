import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { LinkButton } from "@/components/ui";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Building Manager</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          Building management software, without the enterprise price tag
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Maintenance, facility bookings, billing, visitors, and announcements — everything a small or medium
          building needs, in one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <LinkButton href="/signup" size="md">
            Get started
          </LinkButton>
          <LinkButton href="/login" variant="secondary" size="md">
            Log in
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
