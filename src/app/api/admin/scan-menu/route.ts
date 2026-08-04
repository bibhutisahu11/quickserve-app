import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Extend Vercel serverless timeout — vision AI can take 20-40s
export const maxDuration = 60;

export interface ScannedMenuItem {
  name: string;
  description: string;
  price: number;
  category: string;
}

const SCAN_PROMPT = `You are a restaurant menu digitizer. Analyze this menu image and extract ALL food and drink items.

Return a JSON object with this exact structure:
{
  "items": [
    {
      "name": "Item name",
      "description": "Brief description if visible, else empty string",
      "price": 0,
      "category": "Category name"
    }
  ]
}

Rules:
- Extract every visible item (food, drinks, desserts, combos, etc.)
- For "price": extract the numeric value only (no ₹ or currency symbols). If price is not visible, use 0.
- For "category": use the section headers from the menu directly (e.g. "Odia Breakfast Specials", "South Indian Favourites", "Paratha Corner", "Evening Snacks", etc.). If no section header is visible, group intelligently.
- Clean up item names (proper casing, no stray characters)
- If multiple prices exist for the same item (half/full), create separate entries like "Paneer Tikka (Half)" and "Paneer Tikka (Full)"
- Return ONLY valid JSON, nothing else.`;

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not configured. Get a free key at aistudio.google.com/app/apikey and add it to Vercel → Settings → Environment Variables.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large. Max 20 MB allowed." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let raw = "";
    try {
      const result = await model.generateContent([
        SCAN_PROMPT,
        { inlineData: { mimeType, data: base64 } },
      ]);
      raw = result.response.text();
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      if (msg.includes("API_KEY") || msg.includes("401") || msg.toLowerCase().includes("api key")) {
        return NextResponse.json({ error: "Invalid Gemini API key. Check GEMINI_API_KEY on Vercel." }, { status: 502 });
      }
      if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
        return NextResponse.json({ error: "Gemini rate limit hit. Wait a minute and try again." }, { status: 502 });
      }
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 502 });
    }

    // Strip markdown code fences if present
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini raw response:", raw);
      return NextResponse.json(
        { error: "Could not parse AI response. Try a clearer image." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as { items: ScannedMenuItem[] };

    if (!Array.isArray(parsed.items)) {
      return NextResponse.json({ error: "Unexpected AI response format" }, { status: 422 });
    }

    const items: ScannedMenuItem[] = parsed.items.map((item) => ({
      name: String(item.name ?? "").trim(),
      description: String(item.description ?? "").trim(),
      price: typeof item.price === "number" ? item.price : parseFloat(String(item.price)) || 0,
      category: String(item.category ?? "General").trim(),
    }));

    return NextResponse.json({ items, count: items.length });
  } catch (err) {
    console.error("Scan menu error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Scan failed: ${msg}` }, { status: 500 });
  }
}
