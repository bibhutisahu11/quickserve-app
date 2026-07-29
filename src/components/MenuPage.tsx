"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MenuItemData, CartItem } from "@/types";
import MenuCard from "./MenuCard";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";

interface MenuPageProps {
  menuItems: MenuItemData[];
  tableToken?: string;
  tableName?: string;
  orgSlug?: string;
  orgName?: string;
}

// Map hour ranges to suggested category keywords and greeting info
function getTimeContext() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { greeting: "Good Morning",  emoji: "☀️",  keywords: ["breakfast", "morning", "snacks", "beverages", "tea", "coffee"] };
  if (h >= 12 && h < 16) return { greeting: "Good Afternoon", emoji: "🌤️", keywords: ["lunch", "main course", "rice", "meals", "thali"] };
  if (h >= 16 && h < 20) return { greeting: "Good Evening",  emoji: "🌇", keywords: ["snacks", "evening", "beverages", "starters", "chai"] };
  return                         { greeting: "Good Evening",  emoji: "🌙", keywords: ["dinner", "main course", "biryani", "rice", "starters"] };
}

function suggestedCategory(categories: string[], keywords: string[]): string | null {
  for (const kw of keywords) {
    const match = categories.find((c) => c.toLowerCase().includes(kw));
    if (match) return match;
  }
  return null;
}

export default function MenuPage({ menuItems, tableToken, tableName, orgSlug, orgName }: MenuPageProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);

  const timeCtx = useMemo(() => getTimeContext(), []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((i) => i.category))).sort();
    return cats;
  }, [menuItems]);

  // Pick a suggested category based on time-of-day
  const defaultCategory = useMemo(() => {
    const suggested = suggestedCategory(categories, timeCtx.keywords);
    return suggested ?? "All";
  }, [categories, timeCtx]);

  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Apply time-based default once categories are known
  useEffect(() => {
    if (defaultCategory !== "All") setActiveCategory(defaultCategory);
  }, [defaultCategory]);

  const allCategories = useMemo(() => ["All", ...categories], [categories]);

  // Show available items first, unavailable at bottom with a "Sold Out" indicator
  const filtered = useMemo(() => {
    const pool =
      activeCategory === "All"
        ? menuItems
        : menuItems.filter((i) => i.category === activeCategory);
    const avail   = pool.filter((i) =>  i.available);
    const unavail = pool.filter((i) => !i.available);
    return [...avail, ...unavail];
  }, [menuItems, activeCategory]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  function addToCart(item: MenuItemData) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.menuItemId !== itemId);
      return prev.map((c) =>
        c.menuItemId === itemId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  }

  function addByIdToCart(itemId: string) {
    const item = menuItems.find((m) => m.id === itemId);
    if (item) addToCart(item);
  }

  async function handlePlaceOrder(customerName: string, phone: string, notes: string, address: string, email: string, birthday: string) {
    const body = {
      type: tableToken ? "TABLE" : "PARCEL",
      tableToken: tableToken ?? undefined,
      orgSlug: orgSlug ?? undefined,
      customerName,
      phone: phone || undefined,
      email: email || undefined,
      birthday: birthday || undefined,
      deliveryAddress: address || undefined,
      notes: notes || undefined,
      items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to place order");
    }

    const order = await res.json();
    router.push(`/order/${order.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🍽️ Our Menu</h1>
            {tableName ? (
              <p className="text-amber-100 text-sm">Dine-in — {tableName}</p>
            ) : (
              <p className="text-amber-100 text-sm">Parcel / Takeaway Order</p>
            )}
          </div>
          {cartCount > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="bg-white text-amber-600 font-bold rounded-full px-4 py-2 shadow flex items-center gap-2 text-sm"
            >
              🛒 {cartCount} · ₹{cartTotal.toFixed(0)}
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-white text-amber-600 shadow font-bold"
                  : "bg-amber-400/40 text-white"
              }`}
            >
              {cat}
              {cat === defaultCategory && cat !== "All" && (
                <span className="ml-1 text-xs opacity-75">✦</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Time-of-day greeting banner */}
      {showGreeting && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{timeCtx.emoji}</span>
              <div>
                <p className="font-bold text-slate-800">{timeCtx.greeting}! 👋</p>
                <p className="text-sm text-slate-500">
                  {orgName ? `Welcome to ${orgName}` : "Welcome!"}
                  {defaultCategory !== "All" && <> · We suggest <span className="font-semibold text-amber-600">{defaultCategory}</span> right now</>}
                </p>
              </div>
            </div>
            <button onClick={() => setShowGreeting(false)} className="text-slate-300 hover:text-slate-500 text-xl leading-none flex-shrink-0 ml-3">×</button>
          </div>
        </div>
      )}

      {/* Menu grid */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p>No items in this category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              {filtered.filter((i) => i.available).map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  cart={cart}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
            {/* Sold out items */}
            {filtered.some((i) => !i.available) && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="flex-1 h-px bg-slate-200" />
                  Currently Unavailable
                  <span className="flex-1 h-px bg-slate-200" />
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 opacity-50">
                  {filtered.filter((i) => !i.available).map((item) => (
                    <div key={item.id} className="relative">
                      <MenuCard
                        item={item}
                        cart={cart}
                        onAdd={() => {}}
                        onRemove={() => {}}
                      />
                      <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center">
                        <span className="bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">Sold Out</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4">
          <button
            onClick={() => setCartOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl text-base flex items-center gap-3 transition-colors"
          >
            <span className="bg-white text-amber-600 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
              {cartCount}
            </span>
            View Cart · ₹{cartTotal.toFixed(0)}
          </button>
        </div>
      )}

      <CartDrawer
        cart={cart}
        onAdd={addByIdToCart}
        onRemove={removeFromCart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        onPlaceOrder={handlePlaceOrder}
        isParcel={!tableToken}
      />
    </div>
  );
}
