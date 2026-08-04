import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;
  if (!ctx.orgId) return NextResponse.json({ error: "No org context" }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: ctx.orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  return NextResponse.json(org);
}

export async function PATCH(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;
  if (!ctx.orgId) return NextResponse.json({ error: "No org context" }, { status: 400 });

  // Only HOTEL_ADMIN and SUPER_ADMIN can update settings
  if (!["HOTEL_ADMIN", "SUPER_ADMIN"].includes(ctx.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["name", "logoUrl", "address", "phone", "email", "gstNumber", "fssaiNumber", "tagline", "footerText", "upiId"];
  const data: Record<string, string | null> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key] ?? null;
  }

  const updated = await prisma.organization.update({ where: { id: ctx.orgId }, data });
  return NextResponse.json(updated);
}
