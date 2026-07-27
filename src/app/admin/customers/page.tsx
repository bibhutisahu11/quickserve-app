export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomersDashboard from "@/components/CustomersDashboard";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");
  return <CustomersDashboard />;
}
