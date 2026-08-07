import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN", "MANAGER"],
  });
  if (ctx.error) return ctx.error;

  try {
    const discounts = await prisma.discount.findMany({
      where: ctx.orgId ? { orgId: ctx.orgId } : {},
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(discounts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN", "MANAGER"],
  });
  if (ctx.error) return ctx.error;
  if (!ctx.orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  try {
    const body = await req.json();
    const discount = await prisma.discount.create({
      data: {
        orgId:       ctx.orgId,
        name:        body.name,
        description: body.description ?? null,
        type:        body.type,        // PERCENTAGE | FLAT
        value:       Number(body.value),
        scope:       body.scope ?? "ALL",
        itemIds:     body.itemIds    ?? [],
        categories:  body.categories ?? [],
        daysOfWeek:  body.daysOfWeek ?? [],
        minOrder:    body.minOrder ? Number(body.minOrder) : null,
        active:      body.active !== false,
        validFrom:   body.validFrom ? new Date(body.validFrom) : null,
        validTo:     body.validTo   ? new Date(body.validTo)   : null,
      },
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
