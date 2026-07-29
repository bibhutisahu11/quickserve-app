import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;
  if (!["HOTEL_ADMIN", "MANAGER", "SUPER_ADMIN"].includes(ctx.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["name", "category", "quantity", "unit", "minStock"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) data[k] = ["quantity", "minStock"].includes(k) ? Number(body[k]) : body[k];
  }

  const updated = await prisma.inventoryItem.update({
    where: { id: params.id },
    data,
    include: { logs: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;
  if (!["HOTEL_ADMIN", "SUPER_ADMIN"].includes(ctx.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.inventoryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
