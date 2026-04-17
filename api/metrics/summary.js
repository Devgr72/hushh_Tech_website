/**
 * GET /api/metrics/summary?window_days=7
 *
 * Public KPI dashboard API — calls Supabase RPC `get_metrics_summary`.
 * Uses service_role key (server-side only) so the RPC can access auth.users.
 *
 * Query params:
 *   window_days — 7 | 30 | 0 (all-time). Default 7.
 *
 * Response headers:
 *   Cache-Control: public, s-maxage=300 (5 min CDN cache)
 *   X-Robots-Tag: noindex, nofollow
 */
import {
  buildMetricsApiPayload,
  fetchMetricsSummaryData,
} from "./service.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  try {
    const { data, windowDays } = await fetchMetricsSummaryData(
      req.query.window_days
    );

    // Cache for 5 minutes at CDN level, 60s in browser
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, max-age=60, stale-while-revalidate=600"
    );

    return res
      .status(200)
      .json(buildMetricsApiPayload(data, windowDays, "supabase"));
  } catch (err) {
    console.error("[metrics/summary] Unexpected error:", err);
    return res.status(err?.statusCode || 500).json(
      err?.payload || {
        error: err.message || "Internal server error",
      }
    );
  }
}
