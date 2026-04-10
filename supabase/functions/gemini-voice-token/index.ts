/**
 * Gemini Voice Token - Supabase Edge Function
 *
 * This endpoint intentionally does not return upstream Gemini API keys or
 * WebSocket URLs with embedded credentials. Secure brokered live sessions are
 * not enabled yet, so the route fails closed.
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STATUS_MESSAGE =
  "Kai Live is temporarily unavailable while we finish the secure server-side Gemini transport.";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        success: false,
        available: false,
        provider: "none",
        message: STATUS_MESSAGE,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    return new Response(
      JSON.stringify({
        success: false,
        available: false,
        error: "Gemini Live unavailable",
        detail: STATUS_MESSAGE,
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Gemini voice token error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to generate voice token",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
