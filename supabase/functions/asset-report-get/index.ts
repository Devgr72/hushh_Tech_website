import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { plaidRequest } from "../_shared/plaid-client.ts";
import { verifyUser } from "../_shared/auth.ts";

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

    const body = await req.json();
    const { asset_report_token, include_insights, fast_report, options } = body;

    if (!asset_report_token) {
      return new Response(
        JSON.stringify({ error: "asset_report_token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: Record<string, unknown> = { asset_report_token };
    if (include_insights !== undefined) payload.include_insights = include_insights;
    if (fast_report !== undefined) payload.fast_report = fast_report;
    if (options) payload.options = options;

    const result = await plaidRequest({ endpoint: "/asset_report/get", body: payload });

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("asset-report-get error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
