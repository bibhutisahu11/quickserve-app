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

    // Bulk import: { items: [...] }
    if (Array.isArray(body.items)) {
      const created = await prisma.$transaction(
        body.items.map(
          (it: {
            name: string;
            description?: string;
            price: number;
            category: string;
            imageUrl?: string;
            available?: boolean;
            sortOrder?: number;
          }) =>
            prisma.menuItem.create({
              data: {
                name: it.name,
                description: it.description ?? null,
                price: parseFloat(String(it.price)),
                category: it.category,
                imageUrl: it.imageUrl ?? null,
                available: it.available ?? true,
                sortOrder: it.sortOrder ?? 0,
              },
            })
        )
      );
      return NextResponse.json({ created, count: created.length }, { status: 201 });
    }

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
