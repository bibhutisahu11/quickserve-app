import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(tables);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, capacity } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: { name, capacity: capacity ?? 4 },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
