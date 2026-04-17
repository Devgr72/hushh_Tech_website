/**
 * Metrics data fetching service.
 * Calls /api/metrics/summary which uses Supabase service_role RPC.
 */

import type { MetricsApiResponse, MetricsSummary } from "./types";

const API_BASE = "/api/metrics";
const LOCAL_API_BASE = "http://127.0.0.1:3000/api/metrics";
const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1"]);
export const METRICS_STREAM_FALLBACK_REFRESH_MS = 60_000;

const isLikelyHtmlResponse = (body: string, contentType: string | null): boolean => {
  const trimmed = body.trimStart().toLowerCase();

  return (
    (contentType || "").includes("text/html") ||
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html")
  );
};

const buildCandidateUrls = (windowDays: number): string[] => {
  const path = `/summary?window_days=${windowDays}`;
  const candidates = [`${API_BASE}${path}`];

  if (
    typeof window !== "undefined" &&
    LOCALHOST_NAMES.has(window.location.hostname)
  ) {
    candidates.push(`${LOCAL_API_BASE}${path}`);
  }

  return [...new Set(candidates)];
};

const buildStreamUrl = (windowDays: number): string => {
  const path = `/stream?window_days=${windowDays}`;

  if (
    typeof window !== "undefined" &&
    LOCALHOST_NAMES.has(window.location.hostname)
  ) {
    return `${LOCAL_API_BASE}${path}`;
  }

  return `${API_BASE}${path}`;
};

const readJsonPayload = async (res: Response, url: string) => {
  const contentType = res.headers.get("content-type");
  const rawBody = await res.text();

  if (isLikelyHtmlResponse(rawBody, contentType)) {
    throw new Error(`${url} returned HTML instead of JSON.`);
  }

  if (!rawBody.trim()) {
    throw new Error(`${url} returned an empty response.`);
  }

  try {
    return JSON.parse(rawBody) as MetricsApiResponse & {
      error?: string;
      detail?: string;
      hint?: string;
    };
  } catch {
    if (!res.ok) {
      throw new Error(rawBody.trim());
    }

    throw new Error(`${url} returned invalid JSON.`);
  }
};

const readStreamPayload = (rawData: string, url: string) => {
  try {
    return JSON.parse(rawData) as MetricsApiResponse & {
      error?: string;
      detail?: string;
      hint?: string;
    };
  } catch {
    throw new Error(`${url} returned invalid stream payload.`);
  }
};

/**
 * Fetch the full metrics summary for the given window.
 * Returns typed MetricsSummary or throws on failure.
 */
export const fetchMetricsSummary = async (
  windowDays: number = 7
): Promise<MetricsSummary> => {
  const failures: string[] = [];

  for (const url of buildCandidateUrls(windowDays)) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });
      const payload = await readJsonPayload(res, url);

      if (!res.ok) {
        failures.push(
          payload?.detail ||
            payload?.error ||
            payload?.hint ||
            `HTTP ${res.status}: Failed to fetch metrics`
        );
        continue;
      }

      if (!payload.success || !payload.data) {
        failures.push(`${url} returned an invalid metrics response.`);
        continue;
      }

      return payload.data;
    } catch (error) {
      failures.push(
        error instanceof Error ? error.message : "Metrics request failed"
      );
    }
  }

  throw new Error(
    failures[0] ||
      "Metrics summary is unavailable. Start `npm run dev:api` or check the deployed API runtime."
  );
};

export const openMetricsSummaryStream = (
  windowDays: number,
  options: {
    onSnapshot: (data: MetricsSummary) => void;
    onStreamError?: (error: Error) => void;
  }
) => {
  if (
    typeof window === "undefined" ||
    typeof window.EventSource === "undefined"
  ) {
    return null;
  }

  const url = buildStreamUrl(windowDays);
  const source = new window.EventSource(url);

  const handleSnapshot = (event: MessageEvent<string>) => {
    try {
      const payload = readStreamPayload(event.data, url);

      if (!payload.success || !payload.data) {
        throw new Error(`${url} returned an invalid metrics stream response.`);
      }

      options.onSnapshot(payload.data);
    } catch (error) {
      options.onStreamError?.(
        error instanceof Error
          ? error
          : new Error("Metrics stream parsing failed")
      );
    }
  };

  const handleStreamError = () => {
    options.onStreamError?.(
      new Error(`Metrics stream disconnected from ${url}.`)
    );
  };

  source.addEventListener("snapshot", handleSnapshot as EventListener);
  source.addEventListener("error", handleStreamError as EventListener);

  return () => {
    source.removeEventListener("snapshot", handleSnapshot as EventListener);
    source.removeEventListener("error", handleStreamError as EventListener);
    source.close();
  };
};

/**
 * Check if audit data indicates stale sources.
 * Returns warning messages if any data source hasn't updated in 24h.
 */
export const getAuditWarnings = (
  audit: MetricsSummary["audit"]
): string[] => {
  const warnings: string[] = [];
  const staleThresholdMs = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  const sources = [
    { label: "Signups", ts: audit.latest_signup },
    { label: "Persisted users", ts: audit.latest_persisted },
    { label: "Onboarding", ts: audit.latest_onboarding },
    { label: "Profiles", ts: audit.latest_profile },
  ];

  for (const source of sources) {
    if (!source.ts) {
      warnings.push(`${source.label}: no data found`);
      continue;
    }

    const age = now - new Date(source.ts).getTime();
    if (age > staleThresholdMs) {
      const hoursAgo = Math.round(age / (60 * 60 * 1000));
      warnings.push(
        `${source.label}: last update ${hoursAgo}h ago (may be stale)`
      );
    }
  }

  return warnings;
};

/**
 * Format a number with commas for display.
 */
export const formatNumber = (n: number): string => {
  return n.toLocaleString("en-US");
};

/**
 * Format a percentage for display.
 */
export const formatPercent = (n: number): string => {
  return `${n.toFixed(1)}%`;
};

/**
 * Format ISO date string to readable short date.
 */
export const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Format ISO timestamp to readable relative time.
 */
export const formatRelativeTime = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
