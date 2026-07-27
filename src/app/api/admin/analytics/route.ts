import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "month"; // "day" | "month" | "week"

    const now = new Date();
    let since: Date;

    if (period === "day") {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Top selling items in the period
    const topItems = await prisma.orderItem.groupBy({
      by: ["name"],
      where: {
        order: {
          createdAt: { gte: since },
          status: { not: "CANCELLED" },
        },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    // Revenue per day for last 30 days
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: last30Days },
        status: { not: "CANCELLED" },
      },
      select: { createdAt: true, total: true, type: true },
      orderBy: { createdAt: "asc" },
    });

    // Group revenue by date
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
    for (const order of recentOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (!revenueByDay[key]) revenueByDay[key] = { revenue: 0, orders: 0 };
      revenueByDay[key].revenue += order.total;
      revenueByDay[key].orders += 1;
    }

    // Revenue per month for last 6 months
    const last6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: last6Months },
        status: { not: "CANCELLED" },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    });

    const revenueByMonth: Record<string, { revenue: number; orders: number }> = {};
    for (const order of monthlyOrders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!revenueByMonth[key]) revenueByMonth[key] = { revenue: 0, orders: 0 };
      revenueByMonth[key].revenue += order.total;
      revenueByMonth[key].orders += 1;
    }

    // Summary stats
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [todayStats, monthStats, totalStats] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      topItems: topItems.map((i) => ({
        name: i.name,
        quantity: i._sum.quantity ?? 0,
        orderCount: i._count.id,
      })),
      revenueByDay: Object.entries(revenueByDay).map(([date, data]) => ({ date, ...data })),
      revenueByMonth: Object.entries(revenueByMonth).map(([month, data]) => ({ month, ...data })),
      summary: {
        todayRevenue: todayStats._sum.total ?? 0,
        todayOrders: todayStats._count.id,
        periodRevenue: monthStats._sum.total ?? 0,
        periodOrders: monthStats._count.id,
        totalRevenue: totalStats._sum.total ?? 0,
        totalOrders: totalStats._count.id,
      },
      period,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
