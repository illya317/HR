import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import ContractsClient from "./ContractsClient";

export default async function ContractsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.canAccessContract) redirect("/portal");
  return <ContractsClient user={user} />;
}
