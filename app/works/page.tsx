import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import WorksClient from "./WorksClient";

export default async function WorksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.canAccessWorks) redirect("/portal");
  return <WorksClient user={user} />;
}
