import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

export async function POST(req: NextRequest) {
  const secret = process.env.LINE_CHANNEL_SECRET ?? "";
  if (!secret) return NextResponse.json({ ok: false }, { status: 500 });

  const body   = await req.text();
  const sig     = req.headers.get("x-line-signature") ?? "";
  const expected = createHmac("sha256", secret).update(body).digest("base64");

  if (sig !== expected) return NextResponse.json({ ok: false }, { status: 401 });

  const payload = JSON.parse(body) as { events?: Array<{ type: string; source?: { type: string; groupId?: string } }> };

  for (const event of payload.events ?? []) {
    if (event.type === "join" && event.source?.type === "group" && process.env.NODE_ENV === "development") {
      console.log("[LINE] Bot joined group ID:", event.source.groupId);
    }
  }

  return NextResponse.json({ ok: true });
}

// LINE ส่ง GET สำหรับ webhook verification
export async function GET() {
  return NextResponse.json({ ok: true });
}
