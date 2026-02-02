const env = process.env.ASAAS_ENV || "sandbox";
const baseUrl = env === "production" ? "https://www.asaas.com/api/v3" : "https://sandbox.asaas.com/api/v3";
const apiKey = process.env.ASAAS_API_KEY || "";
const defaultAmount = parseFloat(process.env.ASAAS_DEFAULT_PLAN_AMOUNT || "29.9");

async function request(path: string, init: RequestInit) {
  if (!apiKey) {
    return { ok: false, status: 401, data: null };
  }
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "access_token": apiKey,
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

export async function createCustomer(input: { name: string; email: string; cpfCnpj?: string; phone?: string }) {
  return request("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      phone: input.phone,
    }),
  });
}

export async function getCustomerByEmail(email: string) {
  return request(`/customers?email=${encodeURIComponent(email)}`, { method: "GET" });
}

export async function createSubscription(input: { customerId: string; value?: number; description?: string; cycle?: "MONTHLY" | "ANNUAL" }) {
  return request("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      value: typeof input.value === "number" ? input.value : defaultAmount,
      cycle: input.cycle || "MONTHLY",
      description: input.description || "Assinatura VIP",
      billingType: "PIX",
    }),
  });
}
