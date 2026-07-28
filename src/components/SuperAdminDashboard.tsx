"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface OrgStats {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  _count: { admins: number; tables: number; menuItems: number; orders: number };
  stats: { revenue: number; orders: number };
}

export default function SuperAdminDashboard() {
  const [orgs, setOrgs] = useState<OrgStats[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrgs() {
    const res = await fetch("/api/superadmin/orgs");
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchOrgs(); }, []);

  async function toggleActive(org: OrgStats) {
    const res = await fetch(`/api/superadmin/orgs/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !org.active }),
    });
    if (res.ok) fetchOrgs();
  }

  const totalRevenue = orgs.reduce((s, o) => s + o.stats.revenue, 0);
  const totalOrders = orgs.reduce((s, o) => s + o.stats.orders, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Organizations</h1>
          <p className="text-slate-400 mt-1">
            {orgs.length} org{orgs.length !== 1 ? "s" : ""} · ₹{totalRevenue.toLocaleString()} total revenue · {totalOrders} orders
          </p>
        </div>
        <Link
          href="/superadmin/orgs/new"
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          + New Organization
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl animate-pulse mb-3">🏢</div>
          <p>Loading organizations...</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl mb-3">🏢</div>
          <p className="text-xl text-white mb-2">No organizations yet</p>
          <Link
            href="/superadmin/orgs/new"
            className="inline-block mt-4 bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium"
          >
            Create your first org
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <div
              key={org.id}
              className={`bg-slate-800 rounded-2xl p-5 border transition-all ${
                org.active ? "border-slate-700" : "border-red-900 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {org.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.logoUrl} alt={org.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-violet-900 flex items-center justify-center text-xl">
                      🏨
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white">{org.name}</p>
                    <p className="text-slate-400 text-sm">/{org.slug}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    org.active
                      ? "bg-green-900 text-green-300"
                      : "bg-red-900 text-red-300"
                  }`}
                >
                  {org.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xl font-bold text-white">₹{org.stats.revenue.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs">Total Revenue</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xl font-bold text-white">{org.stats.orders}</div>
                  <div className="text-slate-400 text-xs">Orders</div>
                </div>
              </div>

              <div className="flex gap-1.5 text-xs text-slate-400 mb-4">
                <span className="bg-slate-700 rounded px-2 py-1">{org._count.admins} staff</span>
                <span className="bg-slate-700 rounded px-2 py-1">{org._count.tables} tables</span>
                <span className="bg-slate-700 rounded px-2 py-1">{org._count.menuItems} items</span>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/${org.slug}/menu/parcel`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg transition-colors"
                >
                  View Menu
                </a>
                <button
                  onClick={() => toggleActive(org)}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
                    org.active
                      ? "bg-red-900/50 hover:bg-red-900 text-red-300"
                      : "bg-green-900/50 hover:bg-green-900 text-green-300"
                  }`}
                >
                  {org.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
