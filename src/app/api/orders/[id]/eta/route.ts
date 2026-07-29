import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estimateWaitMins, formatWait } from "@/lib/waitingTime";
import { OrderData } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, table: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If order is done/cancelled/ready, no wait
    if (["DONE", "CANCELLED", "READY"].includes(order.status)) {
      return NextResponse.json({ waitMins: 0, label: "Ready!", done: true });
    }

    // Fetch all active orders for this org
    const activeOrders = await prisma.order.findMany({
      where: {
        orgId: order.orgId ?? undefined,
        status: { in: ["PENDING", "PREPARING"] },
      },
      include: { items: true, table: true },
    });

    // Fetch all menu items to build the category map
    const menuItems = await prisma.menuItem.findMany({
      where: { orgId: order.orgId ?? undefined },
      select: { id: true, category: true },
    });
    const categoryMap: Record<string, string> = {};
    for (const m of menuItems) categoryMap[m.id] = m.category;

    const waitMins = estimateWaitMins(
      order as unknown as OrderData,
      activeOrders as unknown as OrderData[],
      categoryMap
    );

    return NextResponse.json({
      waitMins,
      label: formatWait(waitMins),
      done: false,
      status: order.status,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
