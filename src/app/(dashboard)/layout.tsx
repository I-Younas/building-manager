import type { ReactNode } from "react";
import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { logout, switchActiveOrganization } from "@/lib/actions/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, organizationId, role } = await requireOrgScope();

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  const currentOrg = memberships.find((m) => m.organizationId === organizationId);

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          borderBottom: "1px solid #ddd",
          gap: 16,
        }}
      >
        <div>
          <strong>{currentOrg?.organization.name}</strong> · {role}
        </div>

        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/maintenance">Maintenance</Link>
          <Link href="/dashboard/facilities">Facilities</Link>
          <Link href="/dashboard/billing/invoices">Billing</Link>
          {role !== "RESIDENT" ? (
            <>
              <Link href="/dashboard/buildings">Buildings</Link>
              <Link href="/dashboard/residents">Residents</Link>
            </>
          ) : null}
        </nav>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {memberships.length > 1 ? (
            <details>
              <summary>Switch organization</summary>
              {memberships.map((m) => (
                <form key={m.organizationId} action={switchActiveOrganization.bind(null, m.organizationId)}>
                  <button type="submit" disabled={m.organizationId === organizationId}>
                    {m.organization.name}
                  </button>
                </form>
              ))}
            </details>
          ) : null}

          <span>{user.name}</span>
          <form action={logout}>
            <button type="submit">Log out</button>
          </form>
        </div>
      </header>

      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
