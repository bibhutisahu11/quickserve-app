"use client";

import { useEffect, useState } from "react";

interface CustomerOrder {
  id: string;
  type: string;
  table: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

interface Customer {
  key: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  totalSpent: number;
  orderCount: number;
  lastOrderAt: string;
  favouriteItem: string;
  orders: CustomerOrder[];
}

function exportCustomersCsv(customers: Customer[]) {
  const rows = [
    ["Name", "Phone", "Email", "Birthday", "Total Orders", "Total Spent (₹)", "Favourite Item", "Last Order Date"],
  ];
  for (const c of customers) {
    rows.push([
      c.name,
      c.phone,
      c.email ?? "",
      c.birthday ?? "",
      String(c.orderCount),
      c.totalSpent.toFixed(2),
      c.favouriteItem,
      new Date(c.lastOrderAt).toLocaleDateString("en-IN"),
    ]);
  }
  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hotel-customers.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  async function fetchCustomers(q = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCustomers(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCustomers(search);
  }

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 text-sm">{customers.length} unique customers · ₹{totalRevenue.toFixed(0)} lifetime revenue</p>
        </div>
        <button
          onClick={() => exportCustomersCsv(customers)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          📥 Export for Campaign
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800"
        />
        <button
          type="submit"
          className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); fetchCustomers(); }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-4 py-2.5 rounded-xl"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="text-center py-24 text-slate-400">
          <div className="text-5xl animate-pulse mb-3">👥</div>
          <p>Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-lg">No customers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Customer", "Phone", "Orders", "Total Spent", "Favourite Item", "Last Order", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((customer, idx) => (
                  <tr key={customer.key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{customer.name}</p>
                          {idx < 3 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                              {idx === 0 ? "Top Customer" : idx === 1 ? "Regular" : "Frequent"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="hover:text-amber-600 transition-colors block">
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className="text-xs text-blue-500 hover:text-blue-700 block mt-0.5 truncate max-w-[160px]">
                          {customer.email}
                        </a>
                      )}
                      {customer.birthday && (
                        <span className="text-xs text-pink-500 block mt-0.5">
                          🎂 {new Date(customer.birthday).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-100 text-blue-700 font-bold text-sm px-2.5 py-1 rounded-full">
                        {customer.orderCount}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-green-700">
                      ₹{customer.totalSpent.toFixed(0)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm max-w-[160px] truncate">
                      {customer.favouriteItem || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm whitespace-nowrap">
                      {new Date(customer.lastOrderAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelected(selected?.key === customer.key ? null : customer)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                      >
                        {selected?.key === customer.key ? "Hide" : "View History"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order History Side Panel */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                <p className="text-slate-500 text-sm">{selected.phone || "No phone"}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{selected.orderCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Orders</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">₹{selected.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total Spent</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-blue-600 truncate">{selected.favouriteItem || "—"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Favourite</p>
                </div>
              </div>

              <h3 className="font-semibold text-slate-700 mb-3">Order History</h3>
              <div className="space-y-3">
                {selected.orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-slate-500">#{order.id.slice(-6).toUpperCase()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          {order.type === "TABLE" ? `🍽️ ${order.table}` : "📦 Parcel"}
                        </span>
                        <span className="font-bold text-green-700 text-sm">₹{order.total.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-slate-600">
                          {item.name} × {item.quantity} — ₹{(item.price * item.quantity).toFixed(0)}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
