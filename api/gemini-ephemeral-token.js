/**
 * Gemini Live secure broker status route.
 *
 * This endpoint intentionally does not return upstream Gemini API keys or a
 * WebSocket URL with embedded credentials. Kai Live remains unavailable until a
 * proper server-brokered session transport is implemented.
 */

const STATUS_MESSAGE =
  "Kai Live is temporarily unavailable while we finish the secure server-side Gemini transport.";

function statusPayload() {
  return {
    available: false,
    provider: "none",
    message: STATUS_MESSAGE,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json(statusPayload());
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(503).json({
    error: "Gemini Live unavailable",
    detail: STATUS_MESSAGE,
    available: false,
  });
}
