import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SuperAdminNav from "@/components/SuperAdminNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SuperAdminNav />
      <main>{children}</main>
    </div>
  );
}
