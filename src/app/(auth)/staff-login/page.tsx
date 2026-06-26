import { getDictionary } from "@/lib/i18n/get-dictionary";
import { StaffLoginForm } from "./staff-login-form";

export default async function StaffLoginPage() {
  const dict = await getDictionary();
  return <StaffLoginForm dict={dict.auth.staffLogin} />;
}
