import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN", "MANAGER"],
  });
  if (ctx.error) return ctx.error;
  if (!ctx.orgId) return NextResponse.json({ error: "No org context" }, { status: 400 });

  try {
    const { id } = await params;

    // Verify the staff member belongs to this org
    const staff = await prisma.admin.findUnique({ where: { id } });
    if (!staff || staff.orgId !== ctx.orgId) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Managers can only remove WAITER/KITCHEN
    if (ctx.role === "MANAGER" && !["WAITER", "KITCHEN"].includes(staff.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await prisma.admin.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req, {
    requireRoles: ["SUPER_ADMIN", "HOTEL_ADMIN"],
  });
  if (ctx.error) return ctx.error;
  if (!ctx.orgId) return NextResponse.json({ error: "No org context" }, { status: 400 });

  try {
    const { id } = await params;
    const { name, role } = await req.json();

    const staff = await prisma.admin.findUnique({ where: { id } });
    if (!staff || staff.orgId !== ctx.orgId) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const updated = await prisma.admin.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
