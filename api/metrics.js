/**
 * GET /api/metrics
 *
 * Friendly index endpoint for the metrics API namespace.
 * Helps when the base URL is opened directly in the browser.
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  return res.status(200).json({
    ok: true,
    message: "Use the metrics summary endpoint or the public dashboard.",
    routes: {
      dashboard: "/metrics",
      summary: "/api/metrics/summary?window_days=7",
    },
  });
}
