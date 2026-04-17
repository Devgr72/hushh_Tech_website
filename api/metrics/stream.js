import {
  buildMetricsApiPayload,
  fetchMetricsSummaryData,
  parseWindowDays,
} from "./service.js";

const STREAM_RETRY_MS = 5_000;
const STREAM_PUSH_INTERVAL_MS = 15_000;
const STREAM_HEARTBEAT_INTERVAL_MS = 20_000;

const writeEvent = (res, eventName, payload) => {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  const windowDays = parseWindowDays(req.query.window_days);

  res.shouldKeepOpen = true;
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write(`retry: ${STREAM_RETRY_MS}\n\n`);

  let isClosed = false;
  let isSending = false;

  const cleanup = () => {
    if (isClosed) return;
    isClosed = true;
    clearInterval(snapshotInterval);
    clearInterval(heartbeatInterval);
    if (!res.writableEnded) {
      res.end();
    }
  };

  const pushSnapshot = async () => {
    if (isClosed || isSending) return;
    isSending = true;

    try {
      const { data } = await fetchMetricsSummaryData(windowDays);
      writeEvent(
        res,
        "snapshot",
        buildMetricsApiPayload(data, windowDays, "supabase-stream")
      );
    } catch (error) {
      const payload =
        error?.payload || {
          error: error instanceof Error ? error.message : "Metrics stream failed",
        };

      writeEvent(res, "error", payload);
    } finally {
      isSending = false;
    }
  };

  const snapshotInterval = setInterval(pushSnapshot, STREAM_PUSH_INTERVAL_MS);
  const heartbeatInterval = setInterval(() => {
    if (!isClosed) {
      res.write(": heartbeat\n\n");
    }
  }, STREAM_HEARTBEAT_INTERVAL_MS);

  req.on("close", cleanup);
  req.on("aborted", cleanup);
  res.on?.("close", cleanup);

  await pushSnapshot();
}
