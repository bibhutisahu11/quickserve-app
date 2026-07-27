import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, price, category, imageUrl, available, sortOrder } = body;

    if (!name || !price || !category) {
      return NextResponse.json({ error: "name, price, and category are required" }, { status: 400 });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description ?? null,
        price: parseFloat(price),
        category,
        imageUrl: imageUrl ?? null,
        available: available ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
