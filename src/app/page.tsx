import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main style={{ padding: 48, maxWidth: 640, margin: "0 auto" }}>
      <h1>Building Manager</h1>
      <p>Simple building management software for small and medium buildings.</p>
      <p>
        <Link href="/signup">Get started</Link> · <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
