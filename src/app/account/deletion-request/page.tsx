import { AccountDeletionForm } from "@/components/account-deletion-form";
import { requireUser } from "@/lib/auth";

export default async function AccountDeletionRequestPage() {
  await requireUser();
  return <AccountDeletionForm />;
}
