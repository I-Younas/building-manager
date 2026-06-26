import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LoginTabs, type LoginRole } from "./login-tabs";

const ROLE_PARAM: Record<string, LoginRole> = {
  admin: "ORG_ADMIN",
  resident: "RESIDENT",
  staff: "STAFF",
};

const VALID_ROLES: LoginRole[] = ["ORG_ADMIN", "RESIDENT", "STAFF"];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const [dict, { role }, cookieStore] = await Promise.all([getDictionary(), searchParams, cookies()]);

  const fromParam = role ? ROLE_PARAM[role] : undefined;
  const fromCookie = cookieStore.get("lastLoginRole")?.value as LoginRole | undefined;
  const initialRole: LoginRole =
    fromParam ?? (fromCookie && VALID_ROLES.includes(fromCookie) ? fromCookie : "ORG_ADMIN");

  return <LoginTabs initialRole={initialRole} dict={dict.auth.login} />;
}
