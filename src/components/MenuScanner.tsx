"use client";

import { useRef, useState } from "react";

interface ScannedItem {
  id: string; // local only for UI key
  name: string;
  description: string;
  price: number;
  category: string;
  selected: boolean;
}

interface MenuScannerProps {
  onClose: () => void;
  onImported: () => void;
}

type Step = "upload" | "scanning" | "review" | "importing" | "done";

export default function MenuScanner({ onClose, onImported }: MenuScannerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [error, setError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  // ── Step 1: pick image ──────────────────────────────────────────────────────
  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  }

  // ── Step 2: scan ────────────────────────────────────────────────────────────
  async function handleScan() {
    if (!file) return;
    setStep("scanning");
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/scan-menu", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setItems(
        data.items.map(
          (
            item: { name: string; description: string; price: number; category: string },
            idx: number
          ) => ({
            ...item,
            id: `scan-${idx}`,
            selected: true,
          })
        )
      );
      setStep("review");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setStep("upload");
    }
  }

  // ── Step 3: edit helpers ────────────────────────────────────────────────────
  function updateItem(id: string, key: keyof ScannedItem, value: string | number | boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function toggleAll(checked: boolean) {
    setItems((prev) => prev.map((i) => ({ ...i, selected: checked })));
  }

  const categories = Array.from(new Set(items.map((i) => i.category))).sort();
  const selectedCount = items.filter((i) => i.selected).length;

  // ── Step 4: import ──────────────────────────────────────────────────────────
  async function handleImport() {
    const toImport = items.filter((i) => i.selected && i.name.trim());
    if (!toImport.length) return;
    setStep("importing");
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: toImport.map(({ name, description, price, category }) => ({
            name: name.trim(),
            description: description.trim() || null,
            price,
            category: category.trim(),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setImportedCount(data.count);
      setStep("done");
      onImported();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("review");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📷</span>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Scan Menu</h2>
              <p className="text-slate-500 text-xs">
                {step === "upload" && "Upload a photo of your physical menu"}
                {step === "scanning" && "AI is reading the menu..."}
                {step === "review" && `${items.length} items found — review before importing`}
                {step === "importing" && "Importing items..."}
                {step === "done" && `${importedCount} items added to your menu!`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6">
          {/* ── STEP: done ─────────────────────────────────────────────── */}
          {step === "done" && (
            <div className="text-center py-10 space-y-4">
              <div className="text-6xl">🎉</div>
              <p className="text-2xl font-bold text-slate-800">{importedCount} items added!</p>
              <p className="text-slate-500">Your menu has been updated successfully.</p>
              <button
                onClick={onClose}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl"
              >
                Back to Menu
              </button>
            </div>
          )}

          {/* ── STEP: scanning / importing ─────────────────────────────── */}
          {(step === "scanning" || step === "importing") && (
            <div className="text-center py-16 space-y-5">
              <div className="inline-block w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-semibold text-slate-700">
                {step === "scanning" ? "Scanning menu with AI…" : "Importing items…"}
              </p>
              <p className="text-slate-400 text-sm">This may take a few seconds</p>
            </div>
          )}

          {/* ── STEP: upload ───────────────────────────────────────────── */}
          {step === "upload" && (
            <div className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all"
              >
                {preview ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Menu preview"
                      className="max-h-72 mx-auto rounded-xl object-contain shadow-md"
                    />
                    <p className="text-sm text-slate-500">
                      {file?.name} · Click to change
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-5xl">📄</div>
                    <p className="font-semibold text-slate-700">
                      Drop your menu image here or click to upload
                    </p>
                    <p className="text-slate-400 text-sm">
                      Supports JPG, PNG, WEBP — up to 20 MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFilePick}
              />

              {/* Tips */}
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
                <p className="font-semibold">Tips for best results:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                  <li>Photograph the menu flat, fully visible, with good lighting</li>
                  <li>Capture one page at a time for accuracy</li>
                  <li>Higher resolution gives more accurate prices</li>
                </ul>
              </div>

              <button
                disabled={!file}
                onClick={handleScan}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl text-lg transition-colors"
              >
                {file ? "Scan with AI ✨" : "Upload a menu image to continue"}
              </button>
            </div>
          )}

          {/* ── STEP: review ───────────────────────────────────────────── */}
          {step === "review" && (
            <div className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Stats bar */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCount === items.length && items.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-sm text-slate-600">
                    <b>{selectedCount}</b> of {items.length} items selected
                  </span>
                </div>
                <button
                  onClick={() => { setStep("upload"); setError(""); }}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  ← Re-scan
                </button>
              </div>

              {/* Items grouped by category */}
              <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const catItems = items.filter((i) => i.category === cat);
                  return (
                    <div key={cat}>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        {cat}
                        <span className="text-slate-400 font-normal normal-case">
                          ({catItems.length})
                        </span>
                      </h3>
                      <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50 shadow-sm">
                        {catItems.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start gap-3 px-4 py-3 transition-opacity ${!item.selected ? "opacity-40" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => updateItem(item.id, "selected", e.target.checked)}
                              className="mt-1 w-4 h-4 accent-amber-500 flex-shrink-0"
                            />
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                placeholder="Item name"
                              />
                              <input
                                type="text"
                                value={item.category}
                                onChange={(e) => updateItem(item.id, "category", e.target.value)}
                                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                placeholder="Category"
                              />
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) =>
                                    updateItem(item.id, "price", parseFloat(e.target.value) || 0)
                                  }
                                  className="border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-sm text-slate-800 w-24 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  placeholder="0"
                                  min={0}
                                />
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-slate-300 hover:text-red-400 transition-colors text-lg"
                                title="Remove"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Import button */}
              <button
                disabled={selectedCount === 0}
                onClick={handleImport}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl text-lg transition-colors"
              >
                {selectedCount > 0
                  ? `Import ${selectedCount} item${selectedCount !== 1 ? "s" : ""} to Menu`
                  : "Select at least one item"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
