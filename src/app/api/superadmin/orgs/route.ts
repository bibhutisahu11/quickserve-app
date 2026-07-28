import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req, { requireRoles: ["SUPER_ADMIN"] });
  if (ctx.error) return ctx.error;

  try {
    const [orgs, revenues, allOrders] = await Promise.all([
      prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { admins: true, tables: true, menuItems: true, orders: true } },
        },
      }),
      // Revenue + order count per org
      prisma.order.groupBy({
        by: ["orgId"],
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: { id: true },
      }),
      // All orders with customer info (for unique customer + top visitor calculation)
      prisma.order.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { orgId: true, customerName: true, phone: true, total: true },
      }),
    ]);

    const revMap = new Map(
      revenues.map((r) => [r.orgId, { revenue: r._sum.total ?? 0, orders: r._count.id }])
    );

    // Build per-org customer map: key = phone || name
    type CustomerEntry = { name: string; phone: string; visits: number; spend: number };
    const orgCustomerMap = new Map<string, Map<string, CustomerEntry>>();

    for (const order of allOrders) {
      if (!order.orgId) continue;
      if (!orgCustomerMap.has(order.orgId)) orgCustomerMap.set(order.orgId, new Map());
      const custMap = orgCustomerMap.get(order.orgId)!;
      const key = order.phone?.trim() || order.customerName.toLowerCase().trim();
      const existing = custMap.get(key);
      if (existing) {
        existing.visits += 1;
        existing.spend += order.total;
        // keep most recent name
      } else {
        custMap.set(key, {
          name: order.customerName,
          phone: order.phone ?? "",
          visits: 1,
          spend: order.total,
        });
      }
    }

    return NextResponse.json(
      orgs.map((org) => {
        const custMap = orgCustomerMap.get(org.id);
        const customers = custMap ? Array.from(custMap.values()) : [];
        const topCustomers = customers
          .sort((a, b) => b.visits - a.visits || b.spend - a.spend)
          .slice(0, 5);
        return {
          ...org,
          stats: revMap.get(org.id) ?? { revenue: 0, orders: 0 },
          customerStats: {
            uniqueCustomers: customers.length,
            topCustomers,
          },
        };
      })
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
