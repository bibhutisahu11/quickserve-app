import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgGuard";
import OpenAI from "openai";

// Extend Vercel serverless timeout — GPT-4o vision can take 20-40s
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
- For "category": use the section headers from the menu directly (e.g. "Odia Breakfast Specials", "South Indian Favourites", "Paratha Corner", "Evening Snacks", etc.). If no section is visible, group intelligently.
- Clean up item names (proper casing, no stray characters)
- If multiple prices exist for the same item (half/full), create separate entries like "Paneer Tikka (Half)" and "Paneer Tikka (Full)"
- Return ONLY valid JSON, nothing else.`;

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on Vercel. Go to Vercel → Project → Settings → Environment Variables and add it." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const maxMB = 20;
    if (file.size > maxMB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Image too large. Max ${maxMB}MB allowed.` },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const openai = new OpenAI({ apiKey });

    let raw = "";
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: SCAN_PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
              },
            ],
          },
        ],
      });
      raw = response.choices[0]?.message?.content ?? "";
    } catch (openaiErr: unknown) {
      // Surface the actual OpenAI error to help with debugging
      const msg =
        openaiErr instanceof Error ? openaiErr.message : String(openaiErr);

      if (msg.includes("401") || msg.toLowerCase().includes("authentication") || msg.toLowerCase().includes("api key")) {
        return NextResponse.json({ error: "Invalid OpenAI API key. Check your OPENAI_API_KEY environment variable on Vercel." }, { status: 502 });
      }
      if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit")) {
        return NextResponse.json({ error: "OpenAI quota exceeded or rate limited. Check your billing at platform.openai.com." }, { status: 502 });
      }
      if (msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("timed out")) {
        return NextResponse.json({ error: "AI scan timed out. Try a smaller or lower-resolution image." }, { status: 504 });
      }
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 502 });
    }

    // Extract JSON even if the model wraps it in markdown code fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("GPT-4o raw response:", raw);
      return NextResponse.json(
        { error: "Could not parse AI response. Try a clearer image." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as { items: ScannedMenuItem[] };

    if (!Array.isArray(parsed.items)) {
      return NextResponse.json({ error: "Unexpected AI response format" }, { status: 422 });
    }

    // Normalise: ensure price is a number, trim strings
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
