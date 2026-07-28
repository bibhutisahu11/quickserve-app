import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");
    const orgId = searchParams.get("orgId");

    let resolvedOrgId: string | undefined;
    if (orgId) {
      resolvedOrgId = orgId;
    } else if (orgSlug) {
      const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
      if (!org) return NextResponse.json([], { status: 200 });
      resolvedOrgId = org.id;
    }

    const tables = await prisma.table.findMany({
      where: { ...(resolvedOrgId ? { orgId: resolvedOrgId } : {}) },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(tables);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN"],
  });
  if (ctx.error) return ctx.error;

  try {
    const { name, capacity } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: { name, capacity: capacity ?? 4, orgId: ctx.orgId },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
