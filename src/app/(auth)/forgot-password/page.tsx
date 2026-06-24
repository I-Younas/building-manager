import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const dict = await getDictionary();
  return <ForgotPasswordForm dict={dict.auth.forgotPassword} />;
}
