import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import WelcomeToast from "@/components/WelcomeToast";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Do NOT enforce org-active check on the login page itself — that causes an infinite redirect loop
  const isLoginPage = pathname === "/admin" || pathname === "/admin/";

  let orgName: string | null = session?.user?.orgName ?? null;
  let orgLogo: string | null = null;
  if (session?.user?.orgId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.orgId },
        select: { name: true, active: true, logoUrl: true },
      });
      if (org?.name) orgName = org.name;
      if (org?.logoUrl) orgLogo = org.logoUrl;

      // Kick out users whose org has been deactivated mid-session
      // Skip this check on the login page itself to avoid an infinite redirect loop
      if (!isLoginPage && session.user.role !== "SUPER_ADMIN" && org && !org.active) {
        redirect("/admin?error=OrgInactive");
      }
    } catch {
      // fall back to JWT values on DB error
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {session && !isLoginPage && <AdminNav orgName={orgName} orgLogo={orgLogo} />}
      {session && !isLoginPage && <WelcomeToast />}
      <main>{children}</main>
    </div>
  );
}
