import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.canAccessAdmin) redirect("/portal");
  return <AdminClient user={user} />;
}
