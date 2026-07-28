export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KitchenView from "@/components/KitchenView";

export default async function KitchenPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");
  const role = session.user.role;
  if (!["KITCHEN", "HOTEL_ADMIN", "MANAGER", "SUPER_ADMIN"].includes(role)) {
    redirect("/admin/dashboard");
  }
  return <KitchenView />;
}
