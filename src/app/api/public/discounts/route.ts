import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required
// GET /api/public/discounts?orgSlug=xyz
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgSlug = searchParams.get("orgSlug");
  if (!orgSlug) return NextResponse.json([], { status: 200 });

  try {
    const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) return NextResponse.json([], { status: 200 });

    const now = new Date();
    const discounts = await prisma.discount.findMany({
      where: {
        orgId: org.id,
        active: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { validTo: null },
              { validTo: { gte: now } },
            ],
          },
        ],
      },
    });

    return NextResponse.json(discounts);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 200 });
  }
}
