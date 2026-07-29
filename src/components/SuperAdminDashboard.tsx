"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoUpload from "./LogoUpload";

interface TopCustomer {
  name: string;
  phone: string;
  visits: number;
  spend: number;
}

interface OrgStats {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  _count: { admins: number; tables: number; menuItems: number; orders: number };
  stats: { revenue: number; orders: number };
  customerStats: { uniqueCustomers: number; topCustomers: TopCustomer[] };
}

const EDIT_EMPTY = { name: "", slug: "", logoUrl: "", address: "", phone: "", email: "", gstNumber: "", fssaiNumber: "", tagline: "", footerText: "" };

export default function SuperAdminDashboard() {
  const [orgs, setOrgs] = useState<OrgStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editOrg, setEditOrg] = useState<OrgStats | null>(null);
  const [editForm, setEditForm] = useState(EDIT_EMPTY);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteOrg, setDeleteOrg] = useState<OrgStats | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function fetchOrgs() {
    const res = await fetch("/api/superadmin/orgs");
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchOrgs(); }, []);

  function openEdit(org: OrgStats) {
    setEditOrg(org);
    setEditError("");
    setEditForm({
      name:        org.name,
      slug:        org.slug,
      logoUrl:     org.logoUrl ?? "",
      address:     "",
      phone:       "",
      email:       "",
      gstNumber:   "",
      fssaiNumber: "",
      tagline:     "",
      footerText:  "",
    });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editOrg) return;
    setEditError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/orgs/${editOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        editForm.name || undefined,
          slug:        editForm.slug || undefined,
          logoUrl:     editForm.logoUrl || null,
          address:     editForm.address || null,
          phone:       editForm.phone || null,
          email:       editForm.email || null,
          gstNumber:   editForm.gstNumber || null,
          fssaiNumber: editForm.fssaiNumber || null,
          tagline:     editForm.tagline || null,
          footerText:  editForm.footerText || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setEditOrg(null);
      fetchOrgs();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleHardDelete() {
    if (!deleteOrg || deleteConfirmName !== deleteOrg.name) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/orgs/${deleteOrg.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteOrg(null);
        setDeleteConfirmName("");
        fetchOrgs();
      }
    } finally {
      setDeleting(false);
    }
  }

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
  const totalCustomers = orgs.reduce((s, o) => s + o.customerStats.uniqueCustomers, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Organizations</h1>
          <p className="text-slate-400 mt-1">
            {orgs.length} org{orgs.length !== 1 ? "s" : ""} · ₹{totalRevenue.toLocaleString()} revenue · {totalOrders} orders · {totalCustomers} unique customers
          </p>
        </div>
        <Link
          href="/superadmin/orgs/new"
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Organization
        </Link>
      </div>

      {/* Platform-level summary */}
      {orgs.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-slate-400 text-sm mt-0.5">Platform Revenue</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-white">{totalCustomers.toLocaleString()}</div>
            <div className="text-slate-400 text-sm mt-0.5">Unique Customers</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-white">{totalOrders.toLocaleString()}</div>
            <div className="text-slate-400 text-sm mt-0.5">Total Orders</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl animate-pulse mb-3">🏢</div>
          <p>Loading organizations...</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl mb-3">🏢</div>
          <p className="text-xl text-white mb-2">No organizations yet</p>
          <Link href="/superadmin/orgs/new" className="inline-block mt-4 bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium">
            Create your first org
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => {
            const isExpanded = expandedId === org.id;
            return (
              <div
                key={org.id}
                className={`bg-slate-800 rounded-2xl border transition-all ${
                  org.active ? "border-slate-700" : "border-red-900 opacity-60"
                }`}
              >
                {/* Main card row */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Logo / Icon */}
                    {org.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={org.logoUrl} alt={org.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-violet-900 flex items-center justify-center text-2xl flex-shrink-0">
                        🏨
                      </div>
                    )}

                    {/* Name + slug */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-lg">{org.name}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          org.active ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                        }`}>
                          {org.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">/{org.slug}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`/${org.slug}/menu/parcel`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View Menu
                      </a>
                      <button
                        onClick={() => openEdit(org)}
                        className="text-xs font-medium bg-violet-900/60 hover:bg-violet-800 text-violet-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => toggleActive(org)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          org.active
                            ? "bg-red-900/50 hover:bg-red-900 text-red-300"
                            : "bg-green-900/50 hover:bg-green-900 text-green-300"
                        }`}
                      >
                        {org.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => { setDeleteOrg(org); setDeleteConfirmName(""); }}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors bg-red-950 hover:bg-red-900 text-red-400 border border-red-800"
                        title="Permanently delete this organisation"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">₹{org.stats.revenue.toLocaleString()}</div>
                      <div className="text-slate-400 text-xs">Revenue</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">{org.stats.orders}</div>
                      <div className="text-slate-400 text-xs">Orders</div>
                    </div>
                    <div className="bg-violet-900/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-violet-300">{org.customerStats.uniqueCustomers}</div>
                      <div className="text-slate-400 text-xs">Unique Customers</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">{org._count.admins}</div>
                      <div className="text-slate-400 text-xs">Staff</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">{org._count.menuItems}</div>
                      <div className="text-slate-400 text-xs">Menu Items</div>
                    </div>
                  </div>

                  {/* Top customers toggle */}
                  {org.customerStats.uniqueCustomers > 0 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : org.id)}
                      className="mt-4 text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {isExpanded ? "▲ Hide" : "▼ Show"} top customers
                      <span className="bg-violet-900 text-violet-300 text-xs rounded-full px-2 py-0.5">
                        {org.customerStats.topCustomers.length}
                      </span>
                    </button>
                  )}
                </div>

                {/* Expanded top customers panel */}
                {isExpanded && org.customerStats.topCustomers.length > 0 && (
                  <div className="border-t border-slate-700 px-5 pb-5 pt-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">
                      Most Frequent Customers
                    </p>
                    <div className="space-y-2">
                      {org.customerStats.topCustomers.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-700/40 rounded-xl px-4 py-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            i === 0 ? "bg-amber-500 text-white" :
                            i === 1 ? "bg-slate-400 text-slate-900" :
                            i === 2 ? "bg-amber-700 text-white" :
                            "bg-slate-700 text-slate-400"
                          }`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm">{c.name}</p>
                            {c.phone && <p className="text-slate-400 text-xs">{c.phone}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-white font-bold text-sm">
                              {c.visits} visit{c.visits !== 1 ? "s" : ""}
                            </p>
                            <p className="text-slate-400 text-xs">₹{c.spend.toLocaleString()} spent</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Hard Delete Confirmation Modal ──────────────────────────────── */}
      {deleteOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteOrg(null)} />
          <div className="relative bg-slate-900 border border-red-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Permanently Delete Organisation</h2>
                <p className="text-red-400 text-sm mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 mb-5 text-sm text-red-300 space-y-1">
              <p className="font-semibold text-red-200">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-0.5 text-red-300/80">
                <li>All staff accounts ({deleteOrg._count.admins})</li>
                <li>All menu items ({deleteOrg._count.menuItems})</li>
                <li>All orders ({deleteOrg._count.orders})</li>
                <li>All tables, inventory &amp; expenses</li>
                <li>The organization itself</li>
              </ul>
            </div>

            <p className="text-slate-300 text-sm mb-2">
              Type <span className="font-bold text-white">{deleteOrg.name}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={deleteOrg.name}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={handleHardDelete}
                disabled={deleteConfirmName !== deleteOrg.name || deleting}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-red-950 disabled:text-red-800 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {deleting ? "Deleting…" : "Delete Forever"}
              </button>
              <button
                onClick={() => setDeleteOrg(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Org Modal ─────────────────────────────────────────────── */}
      {editOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditOrg(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Organization</h2>
                <p className="text-slate-400 text-sm">{editOrg.name}</p>
              </div>
              <button onClick={() => setEditOrg(null)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleEditSave} className="px-6 py-5 space-y-4">
              {editError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3">{editError}</div>
              )}

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Basic Info</p>

              {[
                { label: "Hotel / Org Name *", key: "name", placeholder: "Kalinga Bites" },
                { label: "URL Slug *", key: "slug", placeholder: "kalinga-bites", hint: `Customer URL: /${editForm.slug || "slug"}/menu/parcel` },
              ].map(({ label, key, placeholder, hint }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
                  <input
                    type="text"
                    value={editForm[key as keyof typeof editForm]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                  {hint && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Logo</label>
                <LogoUpload
                  currentUrl={editForm.logoUrl}
                  onChange={(url) => setEditForm((f) => ({ ...f, logoUrl: url }))}
                  dark
                />
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">Business Details (used on receipts)</p>

              {[
                { label: "Address",      key: "address",     placeholder: "123 Main St, City" },
                { label: "Phone",        key: "phone",       placeholder: "+91 98765 43210" },
                { label: "Email",        key: "email",       placeholder: "contact@hotel.com" },
                { label: "GST Number",   key: "gstNumber",   placeholder: "22AAAAA0000A1Z5" },
                { label: "FSSAI Number", key: "fssaiNumber", placeholder: "10012345000123" },
                { label: "Tagline",      key: "tagline",     placeholder: "Taste the tradition" },
                { label: "Footer Text (on receipts)", key: "footerText", placeholder: "Thank you for dining with us!" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
                  <input
                    type="text"
                    value={editForm[key as keyof typeof editForm]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-900 text-white font-bold py-3 rounded-xl transition-colors">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditOrg(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
