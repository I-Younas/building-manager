import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ResidentLoginForm } from "./resident-login-form";

export default async function ResidentLoginPage() {
  const dict = await getDictionary();
  return <ResidentLoginForm dict={dict.auth.residentLogin} />;
}
