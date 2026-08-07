import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN", "MANAGER", "BILLER"],
  });
  if (ctx.error) return ctx.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, price, category, imageUrl, available, sortOrder } = body;

    const item = await prisma.menuItem.update({
      where: { id, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(available !== undefined && { available }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN"], // BILLER intentionally excluded
  });
  if (ctx.error) return ctx.error;

  try {
    const { id } = await params;

    // Detach this menu item from any existing order items before deleting,
    // so order history is preserved even if the FK is still NOT NULL in the DB.
    await prisma.$executeRawUnsafe(
      `UPDATE order_items SET "menuItemId" = NULL WHERE "menuItemId" = $1`,
      id
    );

    await prisma.menuItem.delete({
      where: { id, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
