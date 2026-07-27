"use client";

import { useEffect, useState } from "react";

interface TopItem {
  name: string;
  quantity: number;
  orderCount: number;
}

interface DayRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface MonthRevenue {
  month: string;
  revenue: number;
  orders: number;
}

interface Summary {
  todayRevenue: number;
  todayOrders: number;
  periodRevenue: number;
  periodOrders: number;
  totalRevenue: number;
  totalOrders: number;
}

interface AnalyticsData {
  topItems: TopItem[];
  revenueByDay: DayRevenue[];
  revenueByMonth: MonthRevenue[];
  summary: Summary;
  period: string;
}

const PERIODS = [
  { key: "day", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
      <div
        className={`h-3 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData(p: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(period); }, [period]);

  const maxQty = data ? Math.max(...data.topItems.map((i) => i.quantity), 1) : 1;
  const maxDayRev = data ? Math.max(...data.revenueByDay.map((d) => d.revenue), 1) : 1;
  const maxMonthRev = data ? Math.max(...data.revenueByMonth.map((m) => m.revenue), 1) : 1;

  const last7Days = data?.revenueByDay.slice(-7) ?? [];
  const ITEM_COLORS = [
    "bg-amber-500", "bg-orange-500", "bg-red-400",
    "bg-pink-500", "bg-purple-500", "bg-blue-500",
    "bg-teal-500", "bg-green-500", "bg-lime-500", "bg-cyan-500",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500 text-sm">Sales performance and best sellers</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p.key ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-5xl animate-pulse">📊</div>
        </div>
      ) : !data ? null : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Today's Revenue", value: `₹${data.summary.todayRevenue.toFixed(0)}`, sub: `${data.summary.todayOrders} orders`, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
              { label: period === "day" ? "Today" : period === "week" ? "This Week" : "This Month", value: `₹${data.summary.periodRevenue.toFixed(0)}`, sub: `${data.summary.periodOrders} orders`, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
              { label: "All Time Revenue", value: `₹${data.summary.totalRevenue.toFixed(0)}`, sub: `${data.summary.totalOrders} total orders`, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
            ].map((card) => (
              <div key={card.label} className={`rounded-2xl border p-4 ${card.bg} ${card.border}`}>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                <p className="text-slate-500 text-sm mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Top selling items */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-1">
              🔥 Best Selling Items
              <span className="text-slate-400 font-normal text-sm ml-2">
                ({PERIODS.find((p) => p.key === period)?.label})
              </span>
            </h2>
            <p className="text-slate-400 text-xs mb-5">Sorted by quantity sold</p>

            {data.topItems.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No orders yet for this period</p>
            ) : (
              <div className="space-y-4">
                {data.topItems.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${ITEM_COLORS[idx] ?? "bg-slate-400"}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-700 truncate">{item.name}</span>
                        <span className="text-sm font-bold text-slate-800 ml-2 flex-shrink-0">
                          {item.quantity} sold
                        </span>
                      </div>
                      <Bar value={item.quantity} max={maxQty} color={ITEM_COLORS[idx] ?? "bg-slate-400"} />
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 w-16 text-right">
                      {item.orderCount} orders
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue — Last 7 Days */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-1">📈 Revenue — Last 7 Days</h2>
            <p className="text-slate-400 text-xs mb-5">Daily revenue breakdown</p>

            {last7Days.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {last7Days.map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 flex-shrink-0 font-medium">
                      {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <div className="flex-1">
                      <Bar value={day.revenue} max={maxDayRev} color="bg-blue-500" />
                    </div>
                    <div className="text-right flex-shrink-0 w-28">
                      <span className="text-sm font-bold text-slate-800">₹{day.revenue.toFixed(0)}</span>
                      <span className="text-xs text-slate-400 ml-1">({day.orders} orders)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-1">📅 Monthly Revenue</h2>
            <p className="text-slate-400 text-xs mb-5">Last 6 months</p>

            {data.revenueByMonth.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {data.revenueByMonth.map((m) => {
                  const [year, month] = m.month.split("-");
                  const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-20 flex-shrink-0 font-medium">{label}</span>
                      <div className="flex-1">
                        <Bar value={m.revenue} max={maxMonthRev} color="bg-green-500" />
                      </div>
                      <div className="text-right flex-shrink-0 w-28">
                        <span className="text-sm font-bold text-slate-800">₹{m.revenue.toFixed(0)}</span>
                        <span className="text-xs text-slate-400 ml-1">({m.orders} orders)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
