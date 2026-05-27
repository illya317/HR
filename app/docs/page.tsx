import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import DocsClient from "./DocsClient";

export default async function DocsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <DocsClient user={user} />;
}
