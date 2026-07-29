import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import WelcomeToast from "@/components/WelcomeToast";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  let orgName: string | null = session?.user?.orgName ?? null;
  if (session?.user?.orgId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.orgId },
        select: { name: true },
      });
      if (org?.name) orgName = org.name;
    } catch {
      // fall back to JWT orgName already set above
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {session && <AdminNav orgName={orgName} />}
      {session && <WelcomeToast />}
      <main>{children}</main>
    </div>
  );
}
