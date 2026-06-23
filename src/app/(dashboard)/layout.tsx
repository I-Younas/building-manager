import type { ReactNode } from "react";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { logout, switchActiveOrganization, switchActiveRole } from "@/lib/actions/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { Badge, Button } from "@/components/ui";

const NAV_ITEMS_BASE = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/maintenance", label: "Maintenance" },
  { href: "/dashboard/facilities", label: "Facilities" },
  { href: "/dashboard/billing/invoices", label: "Billing" },
  { href: "/dashboard/visitors", label: "Visitors" },
  { href: "/dashboard/announcements", label: "Announcements" },
];

const NAV_ITEMS_ADMIN = [
  { href: "/dashboard/buildings", label: "Buildings" },
  { href: "/dashboard/residents", label: "Residents" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, organizationId, role, availableRoles } = await requireOrgScope();

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  const currentOrg = memberships.find((m) => m.organizationId === organizationId);
  const navItems = role !== "RESIDENT" ? [...NAV_ITEMS_BASE, ...NAV_ITEMS_ADMIN] : NAV_ITEMS_BASE;

  return (
    <div className="flex min-h-screen">
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
            {availableRoles.length > 1 ? (
              <details className="relative">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-600 hover:text-slate-900">
                  Switch role
                </summary>
                <div className="absolute left-0 z-10 mt-2 w-48 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                  {availableRoles.map((r) => (
                    <form key={r} action={switchActiveRole.bind(null, r)}>
                      <button
                        type="submit"
                        disabled={r === role}
                        className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:font-semibold disabled:text-blue-600"
                      >
                        {r.replace("_", " ")}
                      </button>
                    </form>
                  ))}
                </div>
              </details>
            ) : null}
            {memberships.length > 1 ? (
              <details className="relative">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-600 hover:text-slate-900">
                  Switch organization
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
            <span className="text-sm text-slate-600">{user.name}</span>
            <form action={logout}>
              <Button type="submit" variant="secondary" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
