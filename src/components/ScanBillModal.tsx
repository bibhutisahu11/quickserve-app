"use client";

import { useRef, useState } from "react";

interface ScannedData {
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMode: string;
  vendor: string;
}

interface Props {
  onScanned: (data: ScannedData) => void;
  onClose: () => void;
}

export default function ScanBillModal({ onScanned, onClose }: Props) {
  const [preview, setPreview]   = useState<string | null>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) { setError("Please upload an image file"); return; }
    if (f.size > 10 * 1024 * 1024) { setError("Image must be under 10 MB"); return; }
    setError("");
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleScan() {
    if (!file) return;
    setScanning(true);
    setError("");
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((res, rej) => {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          res(result.split(",")[1]);
        };
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/admin/expenses/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      onScanned(data as ScannedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Scan Bill / Receipt</h2>
              <p className="text-amber-100 text-sm mt-0.5">AI will extract amount, category, date and more</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-light">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${
              dragging ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-400 hover:bg-amber-50/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Bill preview" className="w-full max-h-72 object-contain bg-slate-50" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 hover:opacity-100 bg-white/90 rounded-full px-4 py-2 text-sm font-medium text-slate-700 shadow transition-opacity">
                    Change image
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                <div className="text-5xl">🧾</div>
                <div className="text-center">
                  <p className="font-semibold text-slate-600">Drop bill photo here</p>
                  <p className="text-sm">or click to browse / take a photo</p>
                </div>
                <p className="text-xs text-slate-300">JPG, PNG, WEBP — max 10 MB</p>
              </div>
            )}
          </div>

          {/* Camera shortcut */}
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.setAttribute("capture", "environment");
                inputRef.current.click();
              }
            }}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-amber-700 font-medium py-3 rounded-xl transition-all text-sm"
          >
            <span className="text-xl">📷</span> Take a photo with camera
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Scan hint */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Tips for best results:</p>
            <ul className="space-y-0.5 list-disc list-inside text-blue-600">
              <li>Ensure the bill is flat and well-lit</li>
              <li>Capture the full bill including the total amount</li>
              <li>Avoid shadows or glare on the paper</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleScan}
              disabled={!file || scanning}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {scanning ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Reading bill…
                </>
              ) : (
                <>✨ Scan & Extract</>
              )}
            </button>
            <button onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3.5 rounded-2xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
