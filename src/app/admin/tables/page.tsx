export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TableManager from "@/components/TableManager";

export default async function AdminTablesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");

  return <TableManager />;
}
