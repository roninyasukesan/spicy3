import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const event = String(payload.event || "");
    const status = payload?.payment?.status || payload?.subscription?.status || null;
    return NextResponse.json({ ok: true, event, status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
