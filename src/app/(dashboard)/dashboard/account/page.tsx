import { requireOrgScope } from "@/lib/auth/dal";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/ui";
import { AccountForm } from "./account-form";

export default async function AccountPage() {
  const { user } = await requireOrgScope();
  const dict = await getDictionary();

  return (
    <div>
      <PageHeader title={dict.account.heading} description={dict.account.description} />
      <div className="mt-6 max-w-md">
        <AccountForm email={user.email} phone={user.phone ?? ""} dict={dict.account} />
      </div>
    </div>
  );
}
