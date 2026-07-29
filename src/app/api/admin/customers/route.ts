import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN", "MANAGER"],
  });
  if (ctx.error) return ctx.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const orgFilter = ctx.orgId ? { orgId: ctx.orgId } : {};

    const orders = await prisma.order.findMany({
      where: {
        ...orgFilter,
        status: { not: "CANCELLED" },
        ...(search
          ? {
              OR: [
                { customerName: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        customerName: true,
        phone: true,
        email: true,
        birthday: true,
        total: true,
        type: true,
        status: true,
        createdAt: true,
        table: { select: { name: true } },
        items: { select: { name: true, quantity: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const customerMap = new Map<
      string,
      {
        key: string;
        name: string;
        phone: string;
        email: string;
        birthday: string;
        totalSpent: number;
        orderCount: number;
        lastOrderAt: string;
        orders: typeof orders;
        favouriteItem: string;
      }
    >();

    for (const order of orders) {
      const key = order.phone ?? `nophone_${order.customerName.toLowerCase().replace(/\s+/g, "_")}`;
      const existing = customerMap.get(key);

      if (existing) {
        existing.totalSpent += order.total;
        existing.orderCount += 1;
        if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = order.createdAt.toISOString();
          existing.name = order.customerName;
        }
        if (!existing.email && order.email) existing.email = order.email;
        if (!existing.birthday && order.birthday) existing.birthday = order.birthday;
        existing.orders.push(order);
      } else {
        customerMap.set(key, {
          key,
          name: order.customerName,
          phone: order.phone ?? "",
          email: order.email ?? "",
          birthday: order.birthday ?? "",
          totalSpent: order.total,
          orderCount: 1,
          lastOrderAt: order.createdAt.toISOString(),
          orders: [order],
          favouriteItem: "",
        });
      }
    }

    const customers = Array.from(customerMap.values()).map((c) => {
      const itemCount: Record<string, number> = {};
      for (const o of c.orders) {
        for (const i of o.items) {
          itemCount[i.name] = (itemCount[i.name] ?? 0) + i.quantity;
        }
      }
      const fav = Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0];
      return {
        key: c.key,
        name: c.name,
        phone: c.phone,
        email: c.email,
        birthday: c.birthday,
        totalSpent: c.totalSpent,
        orderCount: c.orderCount,
        lastOrderAt: c.lastOrderAt,
        favouriteItem: fav ? fav[0] : "",
        orders: c.orders.map((o) => ({
          id: o.id,
          type: o.type,
          table: o.table?.name ?? "Parcel",
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
          items: o.items,
        })),
      };
    });

    customers.sort((a, b) => b.totalSpent - a.totalSpent);
    return NextResponse.json({ customers, total: customers.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
