import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const dict = await getDictionary();
  return <LoginForm dict={dict.auth.login} />;
}
