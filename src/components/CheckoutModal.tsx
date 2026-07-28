"use client";

import { useState } from "react";
import { CartItem } from "@/types";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onPlaceOrder: (name: string, phone: string, notes: string, address: string) => Promise<void>;
  isParcel: boolean;
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
  const [address, setAddress] = useState("");
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
      await onPlaceOrder(name, phone, notes, address);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
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

          {isParcel && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Delivery Address <span className="text-slate-400 text-xs">(optional)</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                placeholder="House / flat, street, area..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Special Instructions <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="Any allergies or special requests..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold py-4 rounded-xl text-lg transition-colors"
          >
            {loading ? "Placing Order..." : `Place Order · ₹${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
