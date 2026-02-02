import { NextResponse } from "next/server";
import { createCustomer, getCustomerByEmail, createSubscription } from "@/lib/payments/asaas";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "");
    const name = String(body.name || email.split("@")[0] || "Usuário");
    if (!email) {
      return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
    }

    let customerId: string | null = null;
    const existing = await getCustomerByEmail(email);
    if (existing.ok && Array.isArray(existing.data?.data) && existing.data.data.length > 0) {
      customerId = existing.data.data[0].id;
    } else {
      const created = await createCustomer({ name, email });
      if (!created.ok) {
        return NextResponse.json({ ok: false, error: "customer_create_failed", detail: created.data }, { status: 400 });
      }
      customerId = created.data?.id || null;
    }

    if (!customerId) {
      return NextResponse.json({ ok: false, error: "customer_missing" }, { status: 400 });
    }

    const sub = await createSubscription({ customerId, description: body.description, value: body.amount, cycle: body.cycle });
    if (!sub.ok) {
      return NextResponse.json({ ok: false, error: "subscription_create_failed", detail: sub.data }, { status: 400 });
    }

    return NextResponse.json({ ok: true, subscription: sub.data });
  } catch {
    return NextResponse.json({ ok: false, error: "unexpected_error" }, { status: 500 });
  }
}
