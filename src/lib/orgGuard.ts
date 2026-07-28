import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export type OrgContext = {
  session: Awaited<ReturnType<typeof getServerSession>>;
  orgId: string | null;
  role: string;
  isSuperAdmin: boolean;
  error: null;
};

export type OrgContextError = {
  session: null;
  orgId: null;
  role: null;
  isSuperAdmin: false;
  error: NextResponse;
};

/**
 * Returns the session + orgId for an authenticated API route.
 * Super admins may pass ?orgId= to act on any org.
 * Returns an error NextResponse if unauthenticated.
 */
export async function getOrgContext(
  req: Request,
  opts?: { requireRoles?: string[] }
): Promise<OrgContext | OrgContextError> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      session: null,
      orgId: null,
      role: null,
      isSuperAdmin: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = session.user.role ?? "HOTEL_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  if (opts?.requireRoles && !opts.requireRoles.includes(role)) {
    return {
      session: null,
      orgId: null,
      role: null,
      isSuperAdmin: false,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  let orgId: string | null;
  if (isSuperAdmin) {
    const url = new URL(req.url);
    orgId = url.searchParams.get("orgId");
  } else {
    orgId = session.user.orgId ?? null;
  }

  return { session, orgId, role, isSuperAdmin, error: null };
}
