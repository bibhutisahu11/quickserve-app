import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const url = `${baseUrl}/menu/${table.qrToken}`;

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
