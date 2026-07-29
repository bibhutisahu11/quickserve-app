import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  const items = await prisma.inventoryItem.findMany({
    where: { ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
    include: {
      logs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;
  if (!["HOTEL_ADMIN", "MANAGER", "SUPER_ADMIN"].includes(ctx.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, category, quantity, unit, minStock } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const item = await prisma.inventoryItem.create({
    data: {
      name,
      category: category || "General",
      quantity: Number(quantity) || 0,
      unit: unit || "units",
      minStock: Number(minStock) || 0,
      orgId: ctx.orgId ?? null,
    },
    include: { logs: true },
  });

  // Log initial stock if > 0
  if (item.quantity > 0) {
    await prisma.stockLog.create({
      data: { itemId: item.id, change: item.quantity, type: "IN", note: "Initial stock" },
    });
  }

  return NextResponse.json(item, { status: 201 });
}
