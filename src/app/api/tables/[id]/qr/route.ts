import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  try {
    const { id } = await params;
    const table = await prisma.table.findUnique({
      where: { id, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
      include: { org: true },
    });
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const orgSlug = table.org?.slug ?? "my-hotel";
    const url = `${baseUrl}/${orgSlug}/menu/${table.qrToken}`;

    const qrBuffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
    });

    return new NextResponse(qrBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${table.name.replace(/\s+/g, "-")}-qr.png"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
