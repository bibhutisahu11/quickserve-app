export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TableView from "@/components/TableView";

export default async function TableViewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");

  const role = session.user.role;
  if (!["HOTEL_ADMIN", "MANAGER", "WAITER", "BILLER", "SUPER_ADMIN"].includes(role)) {
    redirect("/admin/dashboard");
  }

  return <TableView />;
}
