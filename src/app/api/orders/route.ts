import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const orders = await prisma.order.findMany({
      where: {
        ...(ctx.orgId ? { orgId: ctx.orgId } : {}),
        ...(status && { status: status as never }),
        ...(type && { type: type as never }),
      },
      include: { items: true, table: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, tableToken, orgSlug, customerName, phone, deliveryAddress, notes, items } = body;

    if (!type || !customerName || !items?.length) {
      return NextResponse.json(
        { error: "type, customerName, and items are required" },
        { status: 400 }
      );
    }

    // Resolve org and table
    let tableId: string | null = null;
    let orgId: string | null = null;

    if (type === "TABLE") {
      if (!tableToken) {
        return NextResponse.json({ error: "tableToken required for table orders" }, { status: 400 });
      }
      const table = await prisma.table.findUnique({
        where: { qrToken: tableToken },
        include: { org: true },
      });
      if (!table) return NextResponse.json({ error: "Invalid table token" }, { status: 404 });
      if (!table.active) return NextResponse.json({ error: "Table is not active" }, { status: 400 });
      tableId = table.id;
      orgId = table.orgId ?? null;
    } else if (orgSlug) {
      // Parcel orders carry orgSlug so we can scope correctly
      const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
      if (org) orgId = org.id;
    }

    // Validate menu items scoped to org
    const menuItemIds: string[] = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        available: true,
        ...(orgId ? { orgId } : {}),
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ error: "One or more items are unavailable" }, { status: 400 });
    }

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));
    let total = 0;
    const orderItemsData = items.map((item: { menuItemId: string; quantity: number }) => {
      const menuItem = menuMap.get(item.menuItemId)!;
      total += menuItem.price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
      };
    });

    const order = await prisma.order.create({
      data: {
        type,
        tableId,
        orgId,
        customerName,
        phone: phone ?? null,
        deliveryAddress: deliveryAddress ?? null,
        notes: notes ?? null,
        total,
        items: { create: orderItemsData },
      },
      include: { items: true, table: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
