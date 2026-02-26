import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { plaidRequest } from "../_shared/plaid-client.ts";
import { verifyUser, supabaseAdmin } from "../_shared/auth.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authResult = await verifyUser(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = authResult;
    const body = await req.json();
    const { item_id, start_date, end_date, account_ids, count, offset } = body;

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "start_date and end_date are required (YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = supabaseAdmin
      .from("plaid_items")
      .select("access_token, item_id, institution_name")
      .eq("user_id", user_id);

    if (item_id) query = query.eq("item_id", item_id);

    const { data: plaidItems, error: dbError } = await query;

    if (dbError || !plaidItems || plaidItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "No linked bank accounts found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = await Promise.allSettled(
      plaidItems.map(async (item: { access_token: string; item_id: string; institution_name: string }) => {
        const options: Record<string, unknown> = {};
        if (account_ids) options.account_ids = account_ids;
        if (count) options.count = count;
        if (offset) options.offset = offset;

        const payload: Record<string, unknown> = {
          access_token: item.access_token,
          start_date,
          end_date,
        };
        if (Object.keys(options).length > 0) payload.options = options;

        const data = await plaidRequest<{
          accounts: unknown[];
          investment_transactions: unknown[];
          securities: unknown[];
          total_investment_transactions: number;
          request_id: string;
        }>({ endpoint: "/investments/transactions/get", body: payload });

        return {
          item_id: item.item_id,
          institution_name: item.institution_name,
          accounts: data.accounts,
          investment_transactions: data.investment_transactions,
          securities: data.securities,
          total_investment_transactions: data.total_investment_transactions,
          request_id: data.request_id,
        };
      })
    );

    const successful = results
      .filter((r: PromiseSettledResult<unknown>) => r.status === "fulfilled")
      .map((r: PromiseSettledResult<unknown>) => (r as PromiseFulfilledResult<unknown>).value);

    const failed = results
      .filter((r: PromiseSettledResult<unknown>) => r.status === "rejected")
      .map((r: PromiseSettledResult<unknown>, idx: number) => ({
        item_id: plaidItems[idx]?.item_id,
        error: (r as PromiseRejectedResult).reason?.message || "Unknown error",
      }));

    return new Response(
      JSON.stringify({
        investments: successful,
        ...(failed.length > 0 ? { errors: failed } : {}),
        retrieved_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("investments-transactions error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
