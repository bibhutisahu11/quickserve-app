import { NextResponse } from "next/server";

// Payment gateway not yet configured — coming soon
export async function POST() {
  return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
}
