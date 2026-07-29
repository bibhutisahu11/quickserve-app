import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Food & Beverages",
  "Staff Salary",
  "Utilities",
  "Rent",
  "Maintenance",
  "Marketing",
  "Supplies & Equipment",
  "Transportation",
  "Miscellaneous",
];

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 503 });
  }

  let imageBase64: string;
  let mimeType: string;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const buf = await file.arrayBuffer();
    imageBase64 = Buffer.from(buf).toString("base64");
    mimeType    = file.type || "image/jpeg";
  } else {
    const body = await req.json();
    if (!body.base64 || !body.mimeType) {
      return NextResponse.json({ error: "base64 and mimeType required" }, { status: 400 });
    }
    imageBase64 = body.base64;
    mimeType    = body.mimeType;
  }

  const client = new OpenAI({ apiKey });

  const systemPrompt = `You are a bill/receipt OCR assistant for a hotel management app.
Extract the following fields from the receipt image and return ONLY valid JSON — no markdown, no explanation.

Fields to extract:
- amount: number (total amount paid, in INR — just the number, no symbol)
- category: string (pick the best match from: ${CATEGORIES.join(", ")})
- description: string (vendor name + brief item summary, max 80 chars)
- date: string (ISO date YYYY-MM-DD; use today if not readable)
- paymentMode: string (pick best match from: ${PAYMENT_MODES.join(", ")}; default "Cash")
- vendor: string (vendor/store name if visible, else empty string)

If a field cannot be determined, use a sensible default. Return JSON only.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: systemPrompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "low" },
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown> = {};
  try {
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
  }

  // Validate + sanitise output
  const today = new Date().toISOString().slice(0, 10);
  const result = {
    amount:      typeof parsed.amount === "number" ? parsed.amount : parseFloat(String(parsed.amount ?? "0")) || 0,
    category:    CATEGORIES.includes(String(parsed.category ?? "")) ? String(parsed.category) : "Miscellaneous",
    description: String(parsed.description ?? parsed.vendor ?? "").slice(0, 120),
    date:        /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.date ?? "")) ? String(parsed.date) : today,
    paymentMode: PAYMENT_MODES.includes(String(parsed.paymentMode ?? "")) ? String(parsed.paymentMode) : "Cash",
    vendor:      String(parsed.vendor ?? ""),
  };

  return NextResponse.json(result);
}
