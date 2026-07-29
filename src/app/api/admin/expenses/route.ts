import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const from  = searchParams.get("from");
  const to    = searchParams.get("to");
  const cat   = searchParams.get("category");

  const where: Record<string, unknown> = {
    ...(ctx.orgId ? { orgId: ctx.orgId } : {}),
    ...(cat ? { category: cat } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to + "T23:59:59") } : {}),
          },
        }
      : {}),
  };

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // Compute summary totals
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

  const now = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart   = new Date(now.getFullYear(), 0, 1);

  const todayTotal  = expenses.filter((e) => new Date(e.date) >= todayStart).reduce((s, e) => s + e.amount, 0);
  const monthTotal  = expenses.filter((e) => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0);
  const yearTotal   = expenses.filter((e) => new Date(e.date) >= yearStart).reduce((s, e) => s + e.amount, 0);

  // Category breakdown
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({ expenses, totalAmount, todayTotal, monthTotal, yearTotal, byCategory });
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;
  if (!["HOTEL_ADMIN", "MANAGER", "SUPER_ADMIN"].includes(ctx.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { amount, category, description, date, paymentMode, addedBy } = await req.json();
  if (!amount || !category) {
    return NextResponse.json({ error: "amount and category are required" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      amount:      Number(amount),
      category,
      description: description ?? null,
      date:        date ? new Date(date) : new Date(),
      paymentMode: paymentMode ?? "Cash",
      orgId:       ctx.orgId ?? null,
      addedBy:     addedBy ?? null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
