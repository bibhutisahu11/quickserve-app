"use client";

import { MenuItemData, CartItem } from "@/types";

interface MenuCardProps {
  item: MenuItemData;
  cart: CartItem[];
  onAdd: (item: MenuItemData) => void;
  onRemove: (itemId: string) => void;
}

export default function MenuCard({ item, cart, onAdd, onRemove }: MenuCardProps) {
  const cartItem = cart.find((c) => c.menuItemId === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
          <span className="text-5xl">🍽️</span>
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-800 leading-tight">{item.name}</h3>
        {item.description && (
          <p className="text-slate-500 text-sm mt-1 flex-1 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-amber-600">₹{item.price.toFixed(2)}</span>

          {qty === 0 ? (
            <button
              onClick={() => onAdd(item)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
            >
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemove(item.id)}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 font-bold flex items-center justify-center transition-colors"
              >
                −
              </button>
              <span className="w-5 text-center font-semibold text-slate-800">{qty}</span>
              <button
                onClick={() => onAdd(item)}
                className="w-8 h-8 bg-amber-500 hover:bg-amber-600 rounded-full text-white font-bold flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
