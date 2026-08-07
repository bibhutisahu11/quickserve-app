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
    const body = await req.json();
    const { status, paymentAction } = body;

    // ── Payment verification (admin only) ──────────────────────────
    // paymentAction: "ACCEPT" → move to PENDING + mark verified
    //                "REJECT" → move to CANCELLED
    if (paymentAction) {
      if (!["HOTEL_ADMIN", "MANAGER", "SUPER_ADMIN", "BILLER"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      if (order.status !== "PAYMENT_PENDING") {
        return NextResponse.json({ error: "Order is not awaiting payment verification" }, { status: 400 });
      }
      const updated = await prisma.order.update({
        where: { id, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
        data: {
          status: paymentAction === "ACCEPT" ? "PENDING" : "CANCELLED",
          paymentVerified: paymentAction === "ACCEPT",
        },
        include: { items: true, table: true },
      });
      return NextResponse.json(updated);
    }

    // ── Regular status update ──────────────────────────────────────
    const validStatuses = ["PENDING", "PREPARING", "READY", "DONE", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

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
    // BILLER can move orders through any active status
    if (role === "BILLER") {
      const allowed = ["PENDING", "PREPARING", "READY", "DONE", "CANCELLED"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "Biller cannot set this status" }, { status: 403 });
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
