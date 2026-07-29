import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getOrgContext } from "@/lib/orgGuard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (ctx.error) return ctx.error;

  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, WEBP or GIF allowed" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 2 MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "png";
  const filename = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
