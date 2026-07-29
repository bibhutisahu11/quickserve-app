"use client";

import { useRef, useState } from "react";

interface Props {
  currentUrl: string;
  onChange: (url: string) => void;
  dark?: boolean;
}

const MAX_BYTES = 300 * 1024; // 300 KB limit for base64 in DB

export default function LogoUpload({ currentUrl, onChange, dark = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(currentUrl);

  async function handleFile(file: File) {
    setError("");
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setError("Only PNG, JPG, WEBP or GIF allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File must be under 300 KB. Current: ${(file.size / 1024).toFixed(0)} KB`);
      return;
    }

    setProcessing(true);
    try {
      // Convert to base64 data URL — stored directly in DB
      const dataUrl: string = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      setPreview(dataUrl);
      onChange(dataUrl);
    } catch {
      setError("Failed to read file");
    } finally {
      setProcessing(false);
    }
  }

  const base = dark
    ? "bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500"
    : "bg-white border-slate-200 text-slate-600 hover:border-amber-400";

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center overflow-hidden flex-shrink-0 ${dark ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl">🏨</span>
          )}
        </div>

        {/* Upload button */}
        <div className="flex-1">
          <button
            type="button"
            disabled={processing}
            onClick={() => inputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl px-4 py-3 text-sm font-medium transition-all ${base} ${processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block" />
                Processing…
              </span>
            ) : preview ? (
              "📷 Change logo"
            ) : (
              "📷 Upload logo (PNG / JPG)"
            )}
          </button>
          <p className={`text-xs mt-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>Max 2 MB · PNG, JPG, WEBP</p>
        </div>

        {/* Remove button */}
        {preview && (
          <button type="button" onClick={() => { setPreview(""); onChange(""); }}
            className={`text-xs px-2 py-1 rounded-lg transition-colors flex-shrink-0 ${dark ? "text-slate-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"}`}>
            ✕ Remove
          </button>
        )}
      </div>

      {error && <p className={`text-xs ${dark ? "text-red-400" : "text-red-500"}`}>⚠️ {error}</p>}
    </div>
  );
}
