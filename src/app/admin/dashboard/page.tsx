export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KitchenDashboard from "@/components/KitchenDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");

  return <KitchenDashboard />;
}
