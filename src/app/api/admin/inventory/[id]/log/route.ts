import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  const { id } = await params;
  const { change, note, type } = await req.json();
  if (!change || !type) {
    return NextResponse.json({ error: "change and type are required" }, { status: 400 });
  }
  if (!["IN", "OUT", "ADJUSTMENT"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const delta = type === "OUT" ? -Math.abs(Number(change)) : Number(change);
  const newQty = Math.max(0, item.quantity + delta);

  const [log, updated] = await prisma.$transaction([
    prisma.stockLog.create({
      data: { itemId: id, change: delta, note: note ?? null, type },
    }),
    prisma.inventoryItem.update({
      where: { id },
      data: { quantity: newQty },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 5 } },
    }),
  ]);

  return NextResponse.json({ log, item: updated });
}
