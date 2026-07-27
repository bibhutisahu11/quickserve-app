import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // login page itself doesn't need protection — redirect to dashboard if already signed in
  return (
    <div className="min-h-screen bg-slate-50">
      {session && <AdminNav />}
      <main className={session ? "pt-0" : ""}>{children}</main>
    </div>
  );
}
