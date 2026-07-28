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
    const { name, logoUrl, active } = await req.json();

    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(active !== undefined && { active }),
      },
    });
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
    // Soft-delete: deactivate the org
    const org = await prisma.organization.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json(org);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
