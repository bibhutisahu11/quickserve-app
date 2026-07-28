export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import WaiterDashboard from "@/components/WaiterDashboard";

export default async function WaiterOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");
  const role = session.user.role;
  if (!["WAITER", "HOTEL_ADMIN", "MANAGER", "SUPER_ADMIN"].includes(role)) {
    redirect("/admin/dashboard");
  }
  return <WaiterDashboard />;
}
