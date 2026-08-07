import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN", "MANAGER"],
  });
  if (ctx.error) return ctx.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.discount.update({
      where: { id, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
      data: {
        name:        body.name        !== undefined ? body.name        : undefined,
        description: body.description !== undefined ? body.description : undefined,
        type:        body.type        !== undefined ? body.type        : undefined,
        value:       body.value       !== undefined ? Number(body.value) : undefined,
        scope:       body.scope       !== undefined ? body.scope       : undefined,
        itemIds:     body.itemIds     !== undefined ? body.itemIds     : undefined,
        categories:  body.categories  !== undefined ? body.categories  : undefined,
        daysOfWeek:  body.daysOfWeek  !== undefined ? body.daysOfWeek  : undefined,
        minOrder:    body.minOrder    !== undefined ? (body.minOrder ? Number(body.minOrder) : null) : undefined,
        active:      body.active      !== undefined ? body.active      : undefined,
        validFrom:   body.validFrom   !== undefined ? (body.validFrom ? new Date(body.validFrom) : null) : undefined,
        validTo:     body.validTo     !== undefined ? (body.validTo   ? new Date(body.validTo)   : null) : undefined,
      },
    });
    return NextResponse.json(updated);
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
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN", "MANAGER"],
  });
  if (ctx.error) return ctx.error;

  try {
    const { id } = await params;
    await prisma.discount.delete({
      where: { id, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
