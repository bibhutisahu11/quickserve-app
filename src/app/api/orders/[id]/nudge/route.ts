import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NUDGE_COOLDOWN_MS = 60 * 1000; // 1 minute between nudges

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (order.status !== "PAYMENT_PENDING") {
      return NextResponse.json({ error: "Order is not awaiting payment verification" }, { status: 400 });
    }

    // Enforce cooldown so customers can't spam
    if (order.nudgedAt) {
      const elapsed = Date.now() - new Date(order.nudgedAt).getTime();
      if (elapsed < NUDGE_COOLDOWN_MS) {
        const waitSec = Math.ceil((NUDGE_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSec}s before nudging again` },
          { status: 429 }
        );
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        nudgeCount: { increment: 1 },
        nudgedAt: new Date(),
      },
    });

    return NextResponse.json({ nudgeCount: updated.nudgeCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
