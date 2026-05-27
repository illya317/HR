import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import PortalClient from "./PortalClient";

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <PortalClient user={user} />;
}
