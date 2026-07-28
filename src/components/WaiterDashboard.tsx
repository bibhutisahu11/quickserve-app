"use client";

import { useEffect, useState } from "react";
import { OrderData, OrderStatus } from "@/types";
import { printOrder } from "@/lib/printOrder";

const STATUS_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  PENDING: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  PREPARING: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  READY: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  DONE: { bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100 text-slate-600" },
  CANCELLED: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-600" },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PREPARING: "Kitchen is preparing",
  READY: "Ready to serve",
  DONE: "Served",
  CANCELLED: "Cancelled",
};

export default function WaiterDashboard() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ACTIVE" | "ALL">("ACTIVE");

  async function fetchOrders() {
    const res = await fetch("/api/orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const displayed = orders.filter((o) =>
    filter === "ACTIVE"
      ? ["PENDING", "PREPARING", "READY"].includes(o.status)
      : true
  );

  const readyCount = orders.filter((o) => o.status === "READY").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-5xl animate-pulse mb-4">🤵</div>
          <p className="text-slate-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Orders</h1>
          <p className="text-slate-500 text-sm">Auto-refreshes every 15 seconds</p>
        </div>
        {readyCount > 0 && (
          <span className="animate-pulse bg-green-500 text-white font-bold px-4 py-2 rounded-xl text-sm">
            {readyCount} order{readyCount !== 1 ? "s" : ""} ready to serve!
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        {(["ACTIVE", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-slate-800 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "ACTIVE" ? "Active Orders" : "All Orders"}
          </button>
        ))}
        <button onClick={fetchOrders} className="ml-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-1.5 rounded-full text-sm">
          Refresh
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-3">🍽️</div>
          <p>No orders here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => {
            const colors = STATUS_COLORS[order.status];
            const isUpdating = updatingId === order.id;

            return (
              <div key={order.id} className={`rounded-xl border p-4 shadow-sm ${colors.bg} ${colors.border}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">
                      #{order.id.slice(-6).toUpperCase()}
                      <span className="ml-2 font-normal text-slate-600 text-sm">
                        {order.customerName}
                        {order.phone ? ` · ${order.phone}` : ""}
                      </span>
                    </p>
                    <p className="text-slate-500 text-sm mt-0.5">
                      {order.type === "TABLE" ? `Table: ${order.table?.name ?? "?"}` : "Parcel"} · {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-700">{item.name} × {item.quantity}</span>
                      <span className="text-slate-500">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="bg-white/60 rounded-lg px-3 py-2 text-sm text-slate-600 italic mb-3">
                    "{order.notes}"
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">₹{order.total.toFixed(0)}</span>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => printOrder(order)}
                      title="Print receipt"
                      className="text-slate-400 hover:text-slate-700 transition-colors text-base px-1"
                    >
                      🖨️
                    </button>
                    {order.status === "READY" && (
                      <button
                        onClick={() => updateStatus(order.id, "DONE")}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                      >
                        {isUpdating ? "..." : "Mark Served"}
                      </button>
                    )}
                    {["PENDING", "PREPARING"].includes(order.status) && (
                      <button
                        onClick={() => updateStatus(order.id, "CANCELLED")}
                        disabled={isUpdating}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
