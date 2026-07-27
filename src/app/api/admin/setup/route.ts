import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// One-time setup route to create the first admin user
// DELETE this route after first use in production!
export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Admin already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: { email, passwordHash, name },
    });

    return NextResponse.json({ id: admin.id, email: admin.email, name: admin.name });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
