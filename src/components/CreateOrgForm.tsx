"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateEmail } from "@/lib/validators";
import LogoUpload from "./LogoUpload";

export default function CreateOrgForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      name,
      // Only auto-update slug if user hasn't manually edited it
      slug: slugEdited ? f.slug : autoSlug(name),
    }));
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugEdited(true);
    setForm((f) => ({ ...f, slug: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const eErr = validateEmail(form.adminEmail);
    if (eErr) { setEmailError(eErr); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          logoUrl: form.logoUrl || null,
          adminName: form.adminName || null,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create org");
      router.push("/superadmin/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create org");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">New Organization</h1>
        <p className="text-slate-400 mt-1">Set up a new hotel on the platform</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-3">Organization Details</h2>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Hotel Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={handleNameChange}
            required
            placeholder="e.g. The Grand Palace Hotel"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            URL Slug * <span className="text-slate-500 font-normal">(used in customer menu URL)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm whitespace-nowrap">quickserve-app.vercel.app/</span>
            <input
              type="text"
              value={form.slug}
              onChange={handleSlugChange}
              required
              pattern="[a-z0-9-]+"
              title="Lowercase letters, numbers, and hyphens only"
              placeholder="grand-palace"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {slugEdited && (
              <button
                type="button"
                onClick={() => { setSlugEdited(false); setForm((f) => ({ ...f, slug: autoSlug(f.name) })); }}
                className="text-xs text-violet-400 hover:text-violet-300 whitespace-nowrap"
                title="Re-sync slug from name"
              >
                ↺ reset
              </button>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Customer menu: /{form.slug || "your-slug"}/menu/parcel
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Logo (optional)</label>
          <LogoUpload
            currentUrl={form.logoUrl}
            onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
            dark
          />
        </div>

        <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-3 pt-2">Hotel Admin Account</h2>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Full Name</label>
          <input
            type="text"
            value={form.adminName}
            onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
            placeholder="e.g. Rajesh Kumar"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Email *</label>
          <input
            type="email"
            value={form.adminEmail}
            onChange={(e) => { setForm((f) => ({ ...f, adminEmail: e.target.value })); setEmailError(""); }}
            onBlur={() => setEmailError(validateEmail(form.adminEmail) ?? "")}
            required
            placeholder="admin@grandpalace.com"
            className={`w-full bg-slate-700 border rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 ${emailError ? "border-red-500" : "border-slate-600"}`}
          />
          {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Password *</label>
          <input
            type="password"
            value={form.adminPassword}
            onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-slate-600 text-slate-300 font-medium py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-900 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            {saving ? "Creating..." : "Create Organization"}
          </button>
        </div>
      </form>
    </div>
  );
}
