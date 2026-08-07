export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KitchenDashboard from "@/components/KitchenDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");

  // BILLER and WAITER don't have a dashboard — send them to their home page
  const role = session.user.role;
  if (role === "BILLER") redirect("/admin/orders");
  if (role === "WAITER") redirect("/admin/orders");
  if (role === "KITCHEN") redirect("/admin/kitchen");

  return <KitchenDashboard />;
}
