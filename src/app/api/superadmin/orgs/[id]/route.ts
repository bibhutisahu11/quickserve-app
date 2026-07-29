import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req, { requireRoles: ["SUPER_ADMIN"] });
  if (ctx.error) return ctx.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ["name", "slug", "logoUrl", "active", "address", "phone", "email", "gstNumber", "fssaiNumber", "tagline", "footerText"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    const org = await prisma.organization.update({ where: { id }, data });
    return NextResponse.json(org);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req, { requireRoles: ["SUPER_ADMIN"] });
  if (ctx.error) return ctx.error;

  try {
    const { id } = await params;

    // Hard delete — cascade in the correct order to avoid FK constraint violations
    await prisma.$transaction([
      // 1. Stock logs (via inventory items — already cascade in schema but be explicit)
      prisma.stockLog.deleteMany({ where: { item: { orgId: id } } }),
      // 2. Inventory items
      prisma.inventoryItem.deleteMany({ where: { orgId: id } }),
      // 3. Order items (cascade from orders, but must go before orders)
      prisma.orderItem.deleteMany({ where: { order: { orgId: id } } }),
      // 4. Orders
      prisma.order.deleteMany({ where: { orgId: id } }),
      // 5. Expenses
      prisma.expense.deleteMany({ where: { orgId: id } }),
      // 6. Menu items
      prisma.menuItem.deleteMany({ where: { orgId: id } }),
      // 7. Tables
      prisma.table.deleteMany({ where: { orgId: id } }),
      // 8. Admins
      prisma.admin.deleteMany({ where: { orgId: id } }),
      // 9. Finally delete the org itself
      prisma.organization.delete({ where: { id } }),
    ]);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
