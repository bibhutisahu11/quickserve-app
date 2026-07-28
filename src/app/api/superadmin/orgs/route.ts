import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req, { requireRoles: ["SUPER_ADMIN"] });
  if (ctx.error) return ctx.error;

  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { admins: true, tables: true, menuItems: true, orders: true } },
      },
    });

    // Total revenue per org
    const revenues = await prisma.order.groupBy({
      by: ["orgId"],
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: { id: true },
    });
    const revMap = new Map(revenues.map((r) => [r.orgId, { revenue: r._sum.total ?? 0, orders: r._count.id }]));

    return NextResponse.json(
      orgs.map((org) => ({
        ...org,
        stats: revMap.get(org.id) ?? { revenue: 0, orders: 0 },
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req, { requireRoles: ["SUPER_ADMIN"] });
  if (ctx.error) return ctx.error;

  try {
    const { name, slug, logoUrl, adminName, adminEmail, adminPassword } = await req.json();

    if (!name || !slug || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "name, slug, adminEmail, and adminPassword are required" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase letters, numbers, and hyphens only" },
        { status: 400 }
      );
    }

    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        logoUrl: logoUrl ?? null,
        admins: {
          create: {
            email: adminEmail,
            passwordHash,
            name: adminName ?? adminEmail,
            role: "HOTEL_ADMIN",
          },
        },
      },
      include: { admins: true },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
