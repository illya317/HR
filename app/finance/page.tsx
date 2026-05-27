import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import FinanceClient from "./FinanceClient";

export default async function FinancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.canAccessFinance) redirect("/portal");
  return <FinanceClient user={user} />;
}
