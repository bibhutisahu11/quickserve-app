import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

// Returns all active tables for the org, each with their live (non-terminal) orders
export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN", "MANAGER", "WAITER", "BILLER"],
  });
  if (ctx.error) return ctx.error;

  try {
    const ACTIVE_STATUSES = ["PAYMENT_PENDING", "PENDING", "PREPARING", "READY"];

    const [tables, activeOrders] = await Promise.all([
      prisma.table.findMany({
        where: { active: true, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
        orderBy: { name: "asc" },
      }),
      prisma.order.findMany({
        where: {
          status: { in: ACTIVE_STATUSES as ("PAYMENT_PENDING" | "PENDING" | "PREPARING" | "READY")[] },
          type: "TABLE",
          ...(ctx.orgId ? { orgId: ctx.orgId } : {}),
        },
        include: {
          items: true,
          table: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Group orders by tableId
    const ordersByTable: Record<string, typeof activeOrders> = {};
    for (const order of activeOrders) {
      if (order.tableId) {
        if (!ordersByTable[order.tableId]) ordersByTable[order.tableId] = [];
        ordersByTable[order.tableId].push(order);
      }
    }

    // Merge tables with their orders
    const result = tables.map((table) => ({
      ...table,
      orders: ordersByTable[table.id] ?? [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
