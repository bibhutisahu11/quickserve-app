"use client";

import { useState } from "react";
import { CartItem } from "@/types";
import Script from "next/script";

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onPlaceOrder: (
    name: string,
    phone: string,
    notes: string,
    payment: RazorpayPaymentResponse
  ) => Promise<void>;
  isParcel: boolean;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function CheckoutModal({
  open,
  onClose,
  cart,
  onPlaceOrder,
  isParcel,
}: CheckoutModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Create Razorpay order on server
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error ?? "Failed to initiate payment");
      }

      const { id: razorpayOrderId, amount } = await orderRes.json();

      // Step 2: Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount,
          currency: "INR",
          name: "Hotel QR Order",
          description: `${isParcel ? "Parcel" : "Table"} Order`,
          order_id: razorpayOrderId,
          prefill: {
            name,
            contact: phone,
          },
          theme: { color: "#f59e0b" },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          },
          handler: async (response: RazorpayPaymentResponse) => {
            try {
              // Step 3: Place order with verified payment details
              await onPlaceOrder(name, phone, notes, response);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: { error: { description: string } }) => {
          reject(new Error(response.error.description ?? "Payment failed"));
        });
        rzp.open();
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      if (message !== "Payment cancelled") {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {isParcel ? "📦 Parcel Order" : "🍽️ Table Order"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Order summary */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                Order Summary
              </h3>
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-slate-800">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-amber-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone Number {isParcel && <span className="text-red-500">*</span>}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={isParcel}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Special Instructions (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                placeholder="Any allergies or special requests..."
              />
            </div>

            {/* Payment badges */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-green-700 text-sm font-semibold mb-1.5">Accepted Payments</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {["GPay", "PhonePe", "Paytm", "UPI", "Cards", "NetBanking"].map((m) => (
                  <span key={m} className="bg-white border border-green-200 text-green-700 px-2 py-1 rounded-full font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                "Opening Payment..."
              ) : (
                <>
                  <span>Pay ₹{total.toFixed(2)}</span>
                  <span className="text-amber-100 text-sm">→ Place Order</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              Order is placed only after successful payment
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
