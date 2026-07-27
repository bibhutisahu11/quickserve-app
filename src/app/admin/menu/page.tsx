export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MenuManager from "@/components/MenuManager";

export default async function AdminMenuPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");

  return <MenuManager />;
}
