"use client";

import { useState, useMemo } from "react";
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
}

export default function MenuPage({ menuItems, tableToken, tableName, orgSlug }: MenuPageProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((i) => i.category))).sort();
    return ["All", ...cats];
  }, [menuItems]);

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? menuItems.filter((i) => i.available)
        : menuItems.filter((i) => i.category === activeCategory && i.available),
    [menuItems, activeCategory]
  );

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

  async function handlePlaceOrder(customerName: string, phone: string, notes: string, address: string) {
    const body = {
      type: tableToken ? "TABLE" : "PARCEL",
      tableToken: tableToken ?? undefined,
      orgSlug: orgSlug ?? undefined,
      customerName,
      phone,
      deliveryAddress: address || undefined,
      notes,
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
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-white text-amber-600 shadow"
                  : "bg-amber-400/40 text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p>No items available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            {filtered.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                cart={cart}
                onAdd={addToCart}
                onRemove={removeFromCart}
              />
            ))}
          </div>
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
