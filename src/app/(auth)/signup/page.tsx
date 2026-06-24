import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const dict = await getDictionary();
  return <SignupForm dict={dict.auth.signup} />;
}
