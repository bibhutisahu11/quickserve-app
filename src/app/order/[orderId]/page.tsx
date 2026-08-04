"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrderData, OrderStatus } from "@/types";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: string; color: string; step: number }
> = {
  PAYMENT_PENDING: { label: "Awaiting Payment Verification", icon: "🔐", color: "text-purple-600", step: 0 },
  PENDING:   { label: "Order Received",  icon: "⏳", color: "text-amber-500", step: 1 },
  PREPARING: { label: "Being Prepared",  icon: "👨‍🍳", color: "text-blue-500",  step: 2 },
  READY:     { label: "Ready!",          icon: "✅", color: "text-green-500", step: 3 },
  DONE:      { label: "Completed",       icon: "🎉", color: "text-green-600", step: 4 },
  CANCELLED: { label: "Cancelled",       icon: "❌", color: "text-red-500",   step: -1 },
};

const STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "PENDING",   label: "Received", icon: "📋" },
  { key: "PREPARING", label: "Preparing", icon: "🍳" },
  { key: "READY",     label: "Ready",    icon: "✅" },
  { key: "DONE",      label: "Done",     icon: "🎉" },
];

export default function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder]       = useState<OrderData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [etaLabel, setEtaLabel] = useState<string | null>(null);

  // Nudge state
  const [nudging, setNudging]       = useState(false);
  const [nudgeMsg, setNudgeMsg]     = useState("");
  const [nudgeCooldown, setNudgeCooldown] = useState(0); // seconds remaining

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) { setError("Order not found"); return; }
      const data = await res.json();
      setOrder(data);
    } catch {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  async function fetchEta() {
    try {
      const res = await fetch(`/api/orders/${orderId}/eta`);
      if (!res.ok) return;
      const data = await res.json();
      setEtaLabel(data.done ? null : data.label);
    } catch { /* ignore */ }
  }

  async function handleNudge() {
    setNudging(true);
    setNudgeMsg("");
    try {
      const res = await fetch(`/api/orders/${orderId}/nudge`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNudgeMsg("✅ Admin has been notified!");
        setNudgeCooldown(60);
        setOrder((prev) => prev ? { ...prev, nudgeCount: data.nudgeCount } : prev);
      } else if (res.status === 429) {
        setNudgeMsg(data.error);
      } else {
        setNudgeMsg("Could not send nudge. Try again.");
      }
    } finally {
      setNudging(false);
    }
  }

  // Countdown timer for nudge cooldown
  useEffect(() => {
    if (nudgeCooldown <= 0) return;
    const t = setInterval(() => setNudgeCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [nudgeCooldown]);

  useEffect(() => {
    fetchOrder();
    fetchEta();
    const orderInterval = setInterval(fetchOrder, 10_000);
    const etaInterval   = setInterval(fetchEta,  30_000);
    return () => { clearInterval(orderInterval); clearInterval(etaInterval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-pulse mb-4">🍽️</div>
          <p className="text-slate-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-slate-700 font-semibold">{error || "Order not found"}</p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status];
  const currentStep = statusInfo.step;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-3 animate-bounce">{statusInfo.icon}</div>
          <h1 className={`text-2xl font-bold ${statusInfo.color}`}>{statusInfo.label}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Order #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* ── Payment pending card ── */}
        {order.status === "PAYMENT_PENDING" && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <p className="font-bold text-purple-800">Payment under review</p>
                <p className="text-purple-600 text-sm mt-0.5">
                  The admin is verifying your UPI payment. Your order will be confirmed shortly.
                </p>
              </div>
            </div>

            {order.upiUtr && (
              <div className="bg-white rounded-xl border border-purple-100 px-4 py-3 text-sm">
                <span className="text-slate-500">UTR: </span>
                <span className="font-mono font-bold text-slate-800">{order.upiUtr}</span>
              </div>
            )}

            {/* Nudge button */}
            <div className="space-y-2">
              <button
                onClick={handleNudge}
                disabled={nudging || nudgeCooldown > 0}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {nudging ? (
                  "Sending..."
                ) : nudgeCooldown > 0 ? (
                  `⏳ Wait ${nudgeCooldown}s to nudge again`
                ) : (
                  <>🔔 Nudge Admin to verify payment</>
                )}
              </button>
              {nudgeMsg && (
                <p className={`text-center text-sm font-medium ${nudgeMsg.startsWith("✅") ? "text-green-600" : "text-orange-600"}`}>
                  {nudgeMsg}
                </p>
              )}
              {order.nudgeCount > 0 && (
                <p className="text-center text-xs text-slate-400">
                  You&apos;ve nudged {order.nudgeCount} time{order.nudgeCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ETA banner */}
        {etaLabel && (order.status === "PENDING" || order.status === "PREPARING") && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">⏱</span>
            <div>
              <p className="font-bold text-orange-700 text-sm">Estimated Wait</p>
              <p className="text-orange-600 text-xl font-extrabold">{etaLabel}</p>
            </div>
            <p className="ml-auto text-xs text-orange-400 text-right leading-tight">
              Updates every<br/>30 seconds
            </p>
          </div>
        )}

        {/* Progress bar (only once payment is verified / confirmed) */}
        {order.status !== "CANCELLED" && order.status !== "PAYMENT_PENDING" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => {
                const isCurrent = order.status === step.key;
                const stepNum = STATUS_CONFIG[step.key].step;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                          isCurrent
                            ? "bg-amber-500 shadow-lg shadow-amber-200 scale-110"
                            : currentStep > stepNum
                            ? "bg-green-500"
                            : "bg-slate-200"
                        }`}
                      >
                        {currentStep > stepNum ? "✓" : step.icon}
                      </div>
                      <span
                        className={`text-xs mt-1 font-medium ${
                          isCurrent ? "text-amber-600" : currentStep > stepNum ? "text-green-600" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 mb-4 transition-colors ${
                          currentStep > stepNum ? "bg-green-400" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-700">Order Details</h2>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                order.type === "TABLE"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {order.type === "TABLE"
                ? `🍽️ ${order.table?.name ?? "Table Order"}`
                : "📦 Parcel"}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.name} × {item.quantity}</span>
                <span className="font-medium text-slate-800">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-between font-bold">
            <span className="text-slate-700">Total</span>
            <span className="text-amber-600 text-lg">₹{order.total.toFixed(2)}</span>
          </div>

          {order.notes && (
            <div className="mt-3 bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              <span className="font-medium">Note: </span>{order.notes}
            </div>
          )}
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-2">Customer</h2>
          <p className="text-slate-800">{order.customerName}</p>
          {order.phone && <p className="text-slate-500 text-sm">{order.phone}</p>}
        </div>

        <p className="text-center text-xs text-slate-400">
          This page refreshes automatically every 10 seconds
        </p>
      </div>
    </div>
  );
}
