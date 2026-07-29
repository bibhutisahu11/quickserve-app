"use client";

import { useEffect, useState } from "react";
import type { OrgSettings } from "@/types";
import { validatePhone, validateEmail } from "@/lib/validators";
import LogoUpload from "./LogoUpload";

interface Field {
  key: keyof OrgSettings;
  label: string;
  placeholder: string;
  hint?: string;
  type?: "text" | "url" | "email" | "tel" | "textarea";
  required?: boolean;
}

const FIELDS: Field[] = [
  { key: "name",        label: "Business Name",         placeholder: "Grand Palace Restaurant",  required: true },
  { key: "tagline",     label: "Tagline / Header line", placeholder: "Taste the tradition since 1990", hint: "Shown below the hotel name on receipts" },
  // logoUrl handled separately via LogoUpload component
  { key: "address",     label: "Address",               placeholder: "123 Main Street, City, State - 560001", type: "textarea" },
  { key: "phone",       label: "Phone",                 placeholder: "+91 98765 43210", type: "tel" },
  { key: "email",       label: "Email",                 placeholder: "contact@yourhotel.com", type: "email" },
  { key: "gstNumber",   label: "GST Number",            placeholder: "22AAAAA0000A1Z5", hint: "Optional — printed on receipts" },
  { key: "fssaiNumber", label: "FSSAI Licence No.",     placeholder: "10020011000013", hint: "Optional — printed on receipts" },
  { key: "footerText",  label: "Receipt Footer",        placeholder: "Thank you for dining with us!", hint: "Shown at the bottom of every receipt" },
];

export default function OrgSettings() {
  const [form, setForm]       = useState<Partial<OrgSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof OrgSettings, string>>>({});

  useEffect(() => {
    fetch("/api/admin/org-settings")
      .then((r) => r.ok ? r.json() : Promise.reject("Failed"))
      .then((data: OrgSettings) => setForm(data))
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  function set(key: keyof OrgSettings, value: string) {
    setForm((prev) => ({ ...prev, [key]: value || null }));
    setSaved(false);
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateField(key: keyof OrgSettings, value: string) {
    if (key === "phone") return validatePhone(value) ?? "";
    if (key === "email") return validateEmail(value) ?? "";
    return "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // Validate phone + email before saving
    const errs: Partial<Record<keyof OrgSettings, string>> = {};
    if (form.phone) errs.phone = validatePhone(form.phone as string) ?? "";
    if (form.email) errs.email = validateEmail(form.email as string) ?? "";
    const hasErrors = Object.values(errs).some(Boolean);
    setFieldErrors(errs);
    if (hasErrors) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/org-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-3">⚙️</div>
          <p className="text-slate-500">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Business Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          These details appear on your admin dashboard and are printed on every receipt.
        </p>
      </div>

      {/* Logo upload */}
      <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4 mb-3">
          {form.logoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={form.logoUrl} alt="logo" className="h-12 w-auto object-contain rounded" onError={(e) => (e.currentTarget.style.display = "none")} />
          )}
          <div>
            <p className="font-bold text-slate-800">{form.name ?? ""}</p>
            {form.tagline && <p className="text-sm text-slate-500">{form.tagline}</p>}
          </div>
        </div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Logo <span className="text-slate-400 font-normal">(optional)</span></label>
        <LogoUpload
          currentUrl={form.logoUrl ?? ""}
          onChange={(url) => setForm((f) => ({ ...f, logoUrl: url || null }))}
        />
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
            ✅ Settings saved successfully!
          </div>
        )}

        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {f.label}
              {!f.required && <span className="text-slate-400 ml-1 font-normal">(optional)</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea
                value={(form[f.key] as string) ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                rows={2}
                placeholder={f.placeholder}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm"
              />
            ) : (
              <input
                type={f.type ?? "text"}
                value={(form[f.key] as string) ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                onBlur={(e) => {
                  const err = validateField(f.key, e.target.value);
                  setFieldErrors((prev) => ({ ...prev, [f.key]: err || undefined }));
                }}
                required={f.required}
                placeholder={f.placeholder}
                className={`w-full border rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm ${fieldErrors[f.key] ? "border-red-400 bg-red-50" : "border-slate-300"}`}
              />
            )}
            {fieldErrors[f.key] && <p className="text-red-500 text-xs mt-1">{fieldErrors[f.key]}</p>}
            {f.hint && <p className="text-xs text-slate-400 mt-1">{f.hint}</p>}
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
