import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import WelcomeToast from "@/components/WelcomeToast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-slate-50">
      {session && <AdminNav />}
      {session && <WelcomeToast />}
      <main>{children}</main>
    </div>
  );
}
