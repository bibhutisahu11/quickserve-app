import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const orders = await prisma.order.findMany({
      where: {
        ...(status && { status: status as never }),
        ...(type && { type: type as never }),
      },
      include: {
        items: true,
        table: true,
      },
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
    const { type, tableToken, customerName, phone, notes, items } = body;

    if (!type || !customerName || !items?.length) {
      return NextResponse.json(
        { error: "type, customerName, and items are required" },
        { status: 400 }
      );
    }

    let tableId: string | null = null;
    if (type === "TABLE") {
      if (!tableToken) {
        return NextResponse.json({ error: "tableToken required for table orders" }, { status: 400 });
      }
      const table = await prisma.table.findUnique({ where: { qrToken: tableToken } });
      if (!table) return NextResponse.json({ error: "Invalid table token" }, { status: 404 });
      if (!table.active) return NextResponse.json({ error: "Table is not active" }, { status: 400 });
      tableId = table.id;
    }

    // Validate menu items and compute total
    const menuItemIds: string[] = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, available: true },
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
        customerName,
        phone: phone ?? null,
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
