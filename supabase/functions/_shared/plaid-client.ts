const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID")!;
const PLAID_SECRET = Deno.env.get("PLAID_SECRET")!;
const PLAID_ENV = Deno.env.get("PLAID_ENV") || "production";

const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

export const PLAID_BASE_URL = PLAID_BASE_URLS[PLAID_ENV];

export interface PlaidRequestOptions {
  endpoint: string;
  body: Record<string, unknown>;
}

export async function plaidRequest<T>(
  options: PlaidRequestOptions
): Promise<T> {
  const { endpoint, body } = options;

  const response = await fetch(`${PLAID_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      ...body,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      JSON.stringify({
        status: response.status,
        plaid_error: errorData,
      })
    );
  }

  return response.json() as Promise<T>;
}

export { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV };
