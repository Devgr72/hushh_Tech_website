import {
  fetchKaiIndiaMarketOverview,
  getKaiIndiaInvestmentAdvice,
  hasKaiIndiaCredentials,
} from "./shared/kaiIndiaService.js";

const ALLOWED_ACTIONS = new Set(["market-overview", "investment-advice"]);
const ALLOWED_PROFILES = new Set(["stability", "growth", "max_profit"]);

function parseBody(req) {
  if (!req.body) return {};
  return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
}

function serviceUnavailable(res) {
  return res.status(503).json({
    error: "Kai India unavailable",
    detail:
      "Kai India requires server-side Gemini credentials. Configure GEMINI_API_KEY on the server runtime.",
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({
      available: hasKaiIndiaCredentials(),
      provider: hasKaiIndiaCredentials() ? "server" : "none",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!hasKaiIndiaCredentials()) {
    return serviceUnavailable(res);
  }

  try {
    const body = parseBody(req);
    const { action } = body;

    if (!ALLOWED_ACTIONS.has(action)) {
      return res.status(400).json({ error: "Unsupported action" });
    }

    if (action === "market-overview") {
      const data = await fetchKaiIndiaMarketOverview();
      return res.status(200).json(data);
    }

    const amount = Number(body.amount);
    const days = Number(body.days);
    const profile = `${body.profile || ""}`;

    if (!Number.isFinite(amount) || amount < 500) {
      return res.status(400).json({ error: "Amount must be at least 500" });
    }

    if (!Number.isFinite(days) || days < 1) {
      return res.status(400).json({ error: "Days must be at least 1" });
    }

    if (!ALLOWED_PROFILES.has(profile)) {
      return res.status(400).json({ error: "Unsupported risk profile" });
    }

    const data = await getKaiIndiaInvestmentAdvice(amount, days, profile);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Kai India API error:", error);
    return res.status(502).json({
      error: "Kai India request failed",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
