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

    // Hard delete — sequential interactive transaction to avoid FK constraint violations
    await prisma.$transaction(async (tx) => {
      // 1. Stock logs (children of inventory items)
      await tx.stockLog.deleteMany({ where: { item: { orgId: id } } });
      // 2. Inventory items
      await tx.inventoryItem.deleteMany({ where: { orgId: id } });
      // 3. Order items (children of orders)
      await tx.orderItem.deleteMany({ where: { order: { orgId: id } } });
      // 4. Orders
      await tx.order.deleteMany({ where: { orgId: id } });
      // 5. Expenses
      await tx.expense.deleteMany({ where: { orgId: id } });
      // 6. Menu items
      await tx.menuItem.deleteMany({ where: { orgId: id } });
      // 7. Tables
      await tx.table.deleteMany({ where: { orgId: id } });
      // 8. Admins
      await tx.admin.deleteMany({ where: { orgId: id } });
      // 9. Finally delete the org itself
      await tx.organization.delete({ where: { id } });
    });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
