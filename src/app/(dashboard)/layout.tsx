import type { ReactNode } from "react";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { logout, switchActiveOrganization } from "@/lib/actions/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { IdleSessionMonitor } from "@/components/idle-session-monitor";
import { AccountMenu } from "@/components/account-menu";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { Badge, Button } from "@/components/ui";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, organizationId, role } = await requireOrgScope();
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  const currentOrg = memberships.find((m) => m.organizationId === organizationId);

  const navItemsBase = [
    { href: "/dashboard", label: dict.nav.dashboard },
    { href: "/dashboard/maintenance", label: dict.nav.maintenance },
    { href: "/dashboard/billing/invoices", label: dict.nav.payments },
    { href: "/dashboard/announcements", label: dict.nav.announcements },
  ];
  const navItemsAdmin = [
    { href: "/dashboard/buildings", label: dict.nav.buildings },
    { href: "/dashboard/residents", label: dict.nav.residents },
    { href: "/dashboard/staff", label: dict.nav.staff },
  ];
  const navItems = role === "ORG_ADMIN" ? [...navItemsBase, ...navItemsAdmin] : navItemsBase;

  return (
    <div className="flex min-h-screen">
      <IdleSessionMonitor dict={dict.session} />
      <aside className="flex w-64 flex-shrink-0 flex-col bg-slate-900 py-6">
        <div className="mb-6 px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">Building Manager</p>
          <p className="mt-1 truncate text-sm text-slate-400">{currentOrg?.organization.name}</p>
        </div>
        <SidebarNav items={navItems} />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <div className="flex items-center gap-3">
            <Badge>{role.replace("_", " ")}</Badge>
            {memberships.length > 1 ? (
              <details className="relative">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-600 hover:text-slate-900">
                  {dict.nav.switchOrg}
                </summary>
                <div className="absolute left-0 z-10 mt-2 w-56 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                  {memberships.map((m) => (
                    <form key={m.organizationId} action={switchActiveOrganization.bind(null, m.organizationId)}>
                      <button
                        type="submit"
                        disabled={m.organizationId === organizationId}
                        className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:font-semibold disabled:text-blue-600"
                      >
                        {m.organization.name}
                      </button>
                    </form>
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <LocaleSwitcher locale={locale} />
            <AccountMenu name={user.name} email={user.email} phone={user.phone ?? ""} dict={dict.account} />
            <form action={logout}>
              <Button type="submit" variant="secondary" size="sm">
                {dict.nav.logout}
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
