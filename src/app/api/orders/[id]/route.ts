import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  const role = ctx.role ?? "";

  try {
    const { id } = await params;
    const { status } = await req.json();

    const validStatuses = ["PENDING", "PREPARING", "READY", "DONE", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Role-based transition guard
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (role === "KITCHEN") {
      const allowed = ["PREPARING", "READY"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "Kitchen can only set PREPARING or READY" }, { status: 403 });
      }
    }
    if (role === "WAITER") {
      const allowed = ["PREPARING", "DONE", "CANCELLED"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "Waiter cannot set this status" }, { status: 403 });
      }
    }

    const updated = await prisma.order.update({
      where: { id, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
      data: { status },
      include: { items: true, table: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
