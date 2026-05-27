import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.canAccessInventory) redirect("/portal");
  return <InventoryClient user={user} />;
}
