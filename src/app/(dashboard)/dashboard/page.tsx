import { requireOrgScope } from "@/lib/auth/dal";

export default async function DashboardPage() {
  const { user, role } = await requireOrgScope();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {role}</p>
    </div>
  );
}
