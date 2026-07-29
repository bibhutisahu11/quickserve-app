"use client";

import { useEffect, useState } from "react";
import { StaffMember, UserRole } from "@/types";
import { validateEmail } from "@/lib/validators";

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  HOTEL_ADMIN: "Hotel Admin",
  MANAGER: "Manager",
  WAITER: "Waiter / Staff",
  KITCHEN: "Kitchen",
};

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-violet-100 text-violet-700",
  HOTEL_ADMIN: "bg-amber-100 text-amber-700",
  MANAGER: "bg-blue-100 text-blue-700",
  WAITER: "bg-green-100 text-green-700",
  KITCHEN: "bg-orange-100 text-orange-700",
};

const CREATABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "HOTEL_ADMIN", label: "Hotel Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "WAITER", label: "Waiter / Staff" },
  { value: "KITCHEN", label: "Kitchen" },
];

const EMPTY_FORM = { name: "", email: "", role: "WAITER" as UserRole, password: "" };

export default function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  async function fetchStaff() {
    const res = await fetch("/api/admin/staff");
    if (res.ok) setStaff(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchStaff(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const eErr = validateEmail(form.email);
    if (eErr) { setEmailError(eErr); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add staff");
      setStaff((prev) => [...prev, data]);
      setFormOpen(false);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add staff");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this staff member?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    if (res.ok) setStaff((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
  }

  const grouped = CREATABLE_ROLES.reduce(
    (acc, r) => {
      const members = staff.filter((s) => s.role === r.value);
      if (members.length) acc[r.value] = members;
      return acc;
    },
    {} as Record<string, StaffMember[]>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
          <p className="text-slate-500 text-sm">{staff.length} team members</p>
        </div>
        <button
          onClick={() => { setFormOpen(true); setError(""); }}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + Add Staff
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl animate-pulse mb-3">👥</div>
          <p>Loading staff...</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-lg">No staff members yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([roleKey, members]) => (
            <div key={roleKey}>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                {ROLE_LABELS[roleKey as UserRole]} ({members.length})
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                      {roleKey === "KITCHEN" ? "👨‍🍳" : roleKey === "WAITER" ? "🤵" : "👔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{member.name ?? member.email}</p>
                      <p className="text-slate-500 text-sm truncate">{member.email}</p>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role as UserRole]}`}>
                      {ROLE_LABELS[member.role as UserRole]}
                    </span>
                    <p className="text-slate-400 text-xs flex-shrink-0">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={deletingId === member.id}
                      className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 p-1 disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add staff modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFormOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Add Staff Member</h2>
              <button
                onClick={() => setFormOpen(false)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setEmailError(""); }}
                  onBlur={() => setEmailError(validateEmail(form.email) ?? "")}
                  required
                  placeholder="staff@hotel.com"
                  className={`w-full border rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 ${emailError ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                />
                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CREATABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 border border-slate-300 text-slate-700 font-medium py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  {saving ? "Adding..." : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
